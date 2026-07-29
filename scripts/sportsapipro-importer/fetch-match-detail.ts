import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchDetail } from "../../src/lib/api/sportsapipro";
import { storeSAPMatchDetail } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatchDetails(
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
  log("fetch-match-detail", `Fetching details for ${matchIds.size} matches`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const detail = await getMatchDetail(matchId);
      await storeSAPMatchDetail(String(matchId), detail);
      stored++;
    } catch (err) {
      log("fetch-match-detail", `Error fetching match ${matchId}: ${err}`);
    }
  }
  log("fetch-match-detail", `Stored ${stored} match details`);
}
