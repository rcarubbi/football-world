import { getTursoClient } from "../../src/lib/turso/client";
import { getMatchEvents } from "../../src/lib/api/bigballs";
import { storeBBDMatchEvents } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatchEvents(leagues: string[], season: number) {
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
  log("fetch-match-events", `Fetching events for ${matchIds.length} matches`);
  let stored = 0;
  for (const matchId of matchIds) {
    try {
      const events = await getMatchEvents(matchId);
      await storeBBDMatchEvents(matchId, events);
      stored++;
    } catch (err) {
      log("fetch-match-events", `Error fetching events for ${matchId}: ${err}`);
    }
  }
  log("fetch-match-events", `Stored ${stored} match events`);
}
