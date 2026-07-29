import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchDetail } from "../../src/lib/api/bigballs";
import { storeBBDMatchDetail } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatchDetails(leagues: string[], season: number) {
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
  log("fetch-match-detail", `Fetching ${matchIds.length} match details`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const detail = await getMatchDetail(matchId);
      await storeBBDMatchDetail(matchId, detail);
      stored++;
    } catch (err) {
      log("fetch-match-detail", `Error fetching match ${matchId}: ${err}`);
    }
  }
  log("fetch-match-detail", `Stored ${stored} match details`);
}
