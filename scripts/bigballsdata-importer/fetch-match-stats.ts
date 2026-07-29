import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchStatistics } from "../../src/lib/api/bigballs";
import { storeBBDMatchStats } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatchStats(leagues: string[], season: number) {
  const client = getTursoClient();
  const result = await client.execute({
    sql: `SELECT raw_json FROM bbd_matches WHERE league_id IN (${leagues.map(() => "?").join(",")}) AND season = ?`,
    args: [...leagues, String(season)],
  });

  const matchIds: string[] = [];
  for (const row of result.rows) {
    const matches = JSON.parse(row.raw_json as string) as { id?: string | number }[];
    for (const m of matches) {
      if (m.id) matchIds.push(String(m.id));
    }
  }
  log("fetch-match-stats", `Fetching stats for ${matchIds.length} matches`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const stats = await getMatchStatistics(matchId);
      await storeBBDMatchStats(matchId, stats);
      stored++;
    } catch (err) {
      log("fetch-match-stats", `Error fetching stats for ${matchId}: ${err}`);
    }
  }
  log("fetch-match-stats", `Stored ${stored} match stats`);
}
