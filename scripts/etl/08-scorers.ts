import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { resolveLeagueSlug, normalizeName, toStr, toInt } from "./normalization";

const log = (msg: string) => console.log(`[scorers] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const leagueRes = await client.execute("SELECT id, slug FROM leagues");
  const leagueBySlug = new Map<string, number>();
  for (const row of leagueRes.rows) {
    leagueBySlug.set(row.slug as string, row.id as number);
  }

  // Pull from SAP top_players
  const sapRes = await client.execute("SELECT raw_json FROM sap_top_players");
  let inserted = 0;

  for (const row of sapRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    if (!raw) continue;
    const tournamentName = raw.uniqueTournament?.name || raw.tournament?.name || "unknown";
    const leagueSlug = resolveLeagueSlug(tournamentName);
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = raw.season?.name || null;

    const entries = raw.topPlayers || [];
    for (const entry of entries) {
      const playerName = entry.player?.name || entry.name;
      if (!playerName) continue;

      const teamName = entry.team?.name;

      const slug = normalizeName(playerName).replace(/\s+/g, "-");
      await client.execute({
        sql: `INSERT INTO top_scorers (league_id, league_slug, season, player_id, player_name, player_slug, team_name, goals, assists, appearances, position, jersey_number, nationality, photo_url, source)
              VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(player_name, league_slug, season) DO UPDATE SET
                goals=excluded.goals, assists=excluded.assists,
                appearances=excluded.appearances,
                photo_url=COALESCE(excluded.photo_url, top_scorers.photo_url),
                updated_at=datetime('now')`,
        args: [
          leagueId, leagueSlug, seasonName, playerName, slug,
          teamName, toInt(entry.goals) || toInt(entry.totalGoals),
          toInt(entry.assists), toInt(entry.appearances) || toInt(entry.matchesAppearances),
          toStr(entry.position) || toStr(entry.field),
          toInt(entry.jerseyNumber) || toInt(entry.shirtNumber),
          toStr(entry.nationality), toStr(entry.player?.imagePath) || toStr(entry.imagePath),
          "sportsapipro",
        ],
      });
      inserted++;
    }
  }

  // Also pull from bbd_scorers
  // BBD league IDs map to our slugs: epl→premier-league, laliga→la-liga, etc.
  const bbdLeagueMap: Record<string, string> = {
    epl: "premier-league", laliga: "la-liga", bundesliga: "bundesliga",
    "serie-a": "serie-a", "seriea": "serie-a",
    "ligue-1": "ligue-1", "ligue1": "ligue-1",
    "champions-league": "champions-league",
  };

  const bbdRes = await client.execute("SELECT league_id, season, category, raw_json FROM bbd_scorers");
  for (const row of bbdRes.rows) {
    const bbdLeagueId = row.league_id as string;
    const leagueSlug = bbdLeagueMap[bbdLeagueId] || bbdLeagueId;
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = row.season as string || null;
    const category = row.category as string;

    const raw = JSON.parse(row.raw_json as string);
    const entries = Array.isArray(raw) ? raw : (raw.scorers || raw.players || []);
    for (const entry of entries) {
      const playerName = entry.player?.name || entry.player_name || entry.name;
      if (!playerName) continue;

      const teamName = entry.team?.name || entry.team_name || entry.team;

      const slug = normalizeName(playerName).replace(/\s+/g, "-");
      // For goals category: set goals; for others: set the relevant field
      const goals = category === "goals" ? toInt(entry.goals) : undefined;
      const assists = category === "assists" ? toInt(entry.assists) : undefined;
      const appearances = (category === "matches_played") ? toInt(entry.matches) || toInt(entry.appearances) : undefined;

      await client.execute({
        sql: `INSERT INTO top_scorers (league_id, league_slug, season, player_id, player_name, player_slug, team_name, goals, assists, appearances, position, jersey_number, nationality, photo_url, source)
              VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(player_name, league_slug, season) DO UPDATE SET
                goals=COALESCE(excluded.goals, top_scorers.goals),
                assists=COALESCE(excluded.assists, top_scorers.assists),
                appearances=COALESCE(excluded.appearances, top_scorers.appearances),
                photo_url=COALESCE(excluded.photo_url, top_scorers.photo_url),
                updated_at=datetime('now')`,
        args: [
          leagueId, leagueSlug, seasonName, playerName, slug,
          teamName, goals ?? null, assists ?? null, appearances ?? null,
          toStr(entry.position), null, toStr(entry.nationality),
          toStr(entry.player?.image_path) || toStr(entry.image_path),
          "bbd",
        ],
      });
      inserted++;
    }
  }

  log(`Done: ${inserted} scorers upserted`);
  return inserted;
}
