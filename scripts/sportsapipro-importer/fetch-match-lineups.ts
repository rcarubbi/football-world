import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchLineups } from "../../src/lib/api/sportsapipro";
import { storeSAPMatchLineups } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatchLineups(
  leagues: { sapTournamentId: number; sapSeasonId: number }[]
) {
  const client = getTursoClient();
  const matchIds = new Set<number>();
  for (const league of leagues) {
    const result = await client.execute({
      sql: `SELECT raw_json FROM sap_matches WHERE tournament_id = ? AND season_id = ?`,
      args: [league.sapTournamentId, league.sapSeasonId],
    });
    for (const row of result.rows) {
      const data = JSON.parse(row.raw_json as string) as { events?: { id?: number }[] };
      for (const e of data.events || []) {
        if (e.id) matchIds.add(e.id);
      }
    }
  }
  log("fetch-match-lineups", `Fetching lineups for ${matchIds.size} matches`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const lineups = await getMatchLineups(matchId);
      await storeSAPMatchLineups(String(matchId), lineups);
      stored++;
    } catch (err) {
      log("fetch-match-lineups", `Error fetching lineups for ${matchId}: ${err}`);
    }
  }
  log("fetch-match-lineups", `Stored ${stored} match lineups`);
}
