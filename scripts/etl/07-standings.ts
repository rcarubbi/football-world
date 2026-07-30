import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { normalizeName, resolveLeagueSlug, toInt } from "./normalization";

const log = (msg: string) => console.log(`[standings] ${msg}`);

function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? year : year - 1;
}

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const leagueRes = await client.execute("SELECT id, slug FROM leagues");
  const leagueBySlug = new Map<string, number>();
  for (const row of leagueRes.rows) {
    leagueBySlug.set(row.slug as string, row.id as number);
  }

  const teamRes = await client.execute("SELECT id, name FROM teams");
  const teamByName = new Map<string, number>();
  for (const row of teamRes.rows) {
    teamByName.set(normalizeName(row.name as string), row.id as number);
  }

  // Build SAP teamId → team_id lookup via sap_teams
  const sapTeamsRes = await client.execute("SELECT sap_id, raw_json FROM sap_teams");
  const sapTeamIdToDbId = new Map<number, number>();
  for (const row of sapTeamsRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const team = raw.team || raw;
    const sapId = Number(row.sap_id);
    const name = team?.name || team?.shortName;
    if (name) {
      const dbId = teamByName.get(normalizeName(name));
      if (dbId) sapTeamIdToDbId.set(sapId, dbId);
    }
  }
  log(`  SAP teamId→db_id mapped: ${sapTeamIdToDbId.size} teams`);

  // Build tournament_id → league_slug from sap_tournaments
  const tourneyRes = await client.execute("SELECT raw_json FROM sap_tournaments");
  const tourneyIdToSlug = new Map<number, string>();
  for (const row of tourneyRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    if (Array.isArray(raw)) {
      for (const t of raw) {
        if (t.id && t.name) {
          tourneyIdToSlug.set(Number(t.id), resolveLeagueSlug(t.name));
        }
      }
    }
  }
  log(`  Tournament ID→slug mapped: ${tourneyIdToSlug.size} tournaments`);

  const currentSeason = getCurrentSeason().toString();
  let inserted = 0;

  // ── SAP standings ──────────────────────────────────────────
  const sapRes = await client.execute("SELECT tournament_id, raw_json FROM sap_standings");
  for (const row of sapRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const entries = Array.isArray(raw) ? raw : (raw.standings?.[0]?.rows || raw.rows || []);
    if (entries.length === 0) continue;

    const tid = Number(row.tournament_id);
    const leagueSlug = tourneyIdToSlug.get(tid) || "unknown";
    const leagueId = leagueBySlug.get(leagueSlug) || null;

    for (const entry of entries) {
      const teamName = entry.teamName;
      if (!teamName) continue;
      if (!entry.played || entry.played === 0) continue;
      const teamId = entry.teamId ? (sapTeamIdToDbId.get(Number(entry.teamId)) || teamByName.get(normalizeName(teamName)) || null) : teamByName.get(normalizeName(teamName)) || null;

      await client.execute({
        sql: `INSERT INTO league_standings (league_id, league_slug, season, team_id, team_name, position, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, form, source)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(league_slug, season, position) DO UPDATE SET
                league_id=excluded.league_id, team_id=excluded.team_id, team_name=excluded.team_name,
                played=excluded.played, won=excluded.won, drawn=excluded.drawn, lost=excluded.lost,
                goals_for=excluded.goals_for, goals_against=excluded.goals_against,
                goal_difference=excluded.goal_difference, points=excluded.points,
                form=excluded.form, source=excluded.source, updated_at=datetime('now')`,
        args: [
          leagueId, leagueSlug, currentSeason, teamId, teamName,
          toInt(entry.position), toInt(entry.played), toInt(entry.won),
          toInt(entry.drawn), toInt(entry.lost), toInt(entry.goalsFor),
          toInt(entry.goalsAgainst), (toInt(entry.goalsFor) ?? 0) - (toInt(entry.goalsAgainst) ?? 0),
          toInt(entry.points), entry.form || null, "sportsapipro",
        ],
      });
      inserted++;
    }
  }

  // ── BBD standings ──────────────────────────────────────────
  // Skip BBD entries with zero games_played (pre-season placeholder)
  // Build bbd_id → league_slug from leagues table
  const leagueBbdRes = await client.execute("SELECT slug, bbd_id FROM leagues WHERE bbd_id IS NOT NULL");
  const bbdIdToSlug = new Map<string, string>();
  for (const row of leagueBbdRes.rows) {
    bbdIdToSlug.set(row.bbd_id as string, row.slug as string);
  }

  const bbdRes = await client.execute("SELECT league_id, season, raw_json FROM bbd_standings");
  for (const row of bbdRes.rows) {
    const bbdLeagueId = row.league_id as string;
    const leagueSlug = bbdIdToSlug.get(bbdLeagueId) || bbdLeagueId;
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = row.season as string || currentSeason;

    const raw = JSON.parse(row.raw_json as string);
    const entries = Array.isArray(raw) ? raw : (raw.table || raw.rows || []);
    for (const entry of entries) {
      const teamName = entry.team_name || entry.team?.name || entry.name;
      if (!teamName) continue;
      const teamId = teamByName.get(normalizeName(teamName)) || null;

      const wins = toInt(entry.wins);
      const ties = toInt(entry.ties);
      const played = toInt(entry.games_played);
      const gf = toInt(entry.points_for);
      const ga = toInt(entry.points_against);

      if (!played || played === 0) continue;

      await client.execute({
        sql: `INSERT INTO league_standings (league_id, league_slug, season, team_id, team_name, position, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, form, source)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(league_slug, season, position) DO UPDATE SET
                league_id=excluded.league_id, team_id=excluded.team_id, team_name=excluded.team_name,
                played=excluded.played, won=excluded.won, drawn=excluded.drawn, lost=excluded.lost,
                goals_for=excluded.goals_for, goals_against=excluded.goals_against,
                goal_difference=excluded.goal_difference, points=excluded.points,
                form=excluded.form, source=excluded.source, updated_at=datetime('now')`,
        args: [
          leagueId, leagueSlug, seasonName, teamId, teamName,
          toInt(entry.rank), played, wins,
          ties, toInt(entry.losses), gf,
          ga, (gf ?? 0) - (ga ?? 0),
          (wins ?? 0) * 3 + (ties ?? 0), null, "bbd",
        ],
      });
      inserted++;
    }
  }

  log(`Done: ${inserted} standings upserted`);
  return inserted;
}
