import { getTursoClient } from "../../src/lib/turso/client";
import { getPlayerStatistics } from "../../src/lib/api/sportsapipro";
import { storeSAPPlayerStatistics } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayerStatistics() {
  const client = getTursoClient();
  const result = await client.execute(`SELECT sap_id FROM sap_players`);
  const playerIds = result.rows.map((r) => r.sap_id as string);

  log("fetch-player-statistics", `Fetching statistics for ${playerIds.length} players`);
  let stored = 0;
  for (const playerId of playerIds) {
    try {
      const stats = await getPlayerStatistics(Number(playerId));
      await storeSAPPlayerStatistics(playerId, stats);
      stored++;
    } catch (err) {
      log("fetch-player-statistics", `Error fetching stats for ${playerId}: ${err}`);
    }
  }
  log("fetch-player-statistics", `Stored ${stored} player statistics`);
}
