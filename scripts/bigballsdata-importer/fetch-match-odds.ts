import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchOdds } from "../../src/lib/api/bigballs";
import { storeBBDMatchOdds } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatchOdds(leagues: string[], season: number) {
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
  log("fetch-match-odds", `Fetching odds for ${matchIds.length} matches`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const odds = await getMatchOdds(matchId);
      await storeBBDMatchOdds(matchId, odds);
      stored++;
    } catch (err) {
      log("fetch-match-odds", `Error fetching odds for ${matchId}: ${err}`);
    }
  }
  log("fetch-match-odds", `Stored ${stored} match odds`);
}
