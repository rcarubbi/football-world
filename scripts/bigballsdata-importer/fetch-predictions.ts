import { getTursoClient } from "../../src/lib/turso/client";
import { getPredictions } from "../../src/lib/api/bigballs";
import { storeBBDPredictions } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPredictions(leagues: string[], season: number) {
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
  log("fetch-predictions", `Fetching predictions for ${matchIds.length} matches`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const predictions = await getPredictions(matchId);
      await storeBBDPredictions(matchId, predictions);
      stored++;
    } catch (err) {
      log("fetch-predictions", `Error fetching predictions for ${matchId}: ${err}`);
    }
  }
  log("fetch-predictions", `Stored ${stored} predictions`);
}
