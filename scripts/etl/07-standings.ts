import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { normalizeName, toInt } from "./normalization";

const log = (msg: string) => console.log(`[standings] ${msg}`);

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

  // Pull from SAP standings (flat array of {position, teamId, teamName, played, won, drawn, lost, goalsFor, goalsAgainst, points})
  const sapRes = await client.execute("SELECT raw_json FROM sap_standings");
  let inserted = 0;

  for (const row of sapRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const entries = Array.isArray(raw) ? raw : (raw.standings?.[0]?.rows || raw.rows || []);
    const leagueSlug = "premier-league"; // SAP standings are for PL
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = "2026/2027"; // Current SAP season

    for (const entry of entries) {
      const teamName = entry.teamName;
      if (!teamName) continue;
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
          leagueId, leagueSlug, seasonName, teamId, teamName,
          toInt(entry.position), toInt(entry.played), toInt(entry.won),
          toInt(entry.drawn), toInt(entry.lost), toInt(entry.goalsFor),
          toInt(entry.goalsAgainst), (toInt(entry.goalsFor) ?? 0) - (toInt(entry.goalsAgainst) ?? 0),
          toInt(entry.points), entry.form || null, "sportsapipro",
        ],
      });
      inserted++;
    }
  }

  // Also pull from bbd_standings
  const bbdLeagueMap: Record<string, string> = {
    epl: "premier-league", laliga: "la-liga", bundesliga: "bundesliga",
    "serie-a": "serie-a", "seriea": "serie-a",
    "ligue-1": "ligue-1", "ligue1": "ligue-1",
    "champions-league": "champions-league",
  };

  const bbdRes = await client.execute("SELECT league_id, season, raw_json FROM bbd_standings");
  for (const row of bbdRes.rows) {
    const bbdLeagueId = row.league_id as string;
    const leagueSlug = bbdLeagueMap[bbdLeagueId] || bbdLeagueId;
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = row.season as string || null;

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
