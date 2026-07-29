import { getTursoClient } from "../../src/lib/turso/client";
import { getPlayerDetails } from "../../src/lib/api/sportsapipro";
import { storeSAPPlayer } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayers() {
  const client = getTursoClient();
  const result = await client.execute(
    `SELECT DISTINCT json_extract(lineups.raw_json, '$.homeTeam.players[*].player.id') as ids
     FROM sap_match_lineups lineups`
  );

  const playerIds = new Set<number>();
  for (const row of result.rows) {
    const ids = row.ids;
    if (Array.isArray(ids)) {
      for (const id of ids) {
        if (typeof id === "number") playerIds.add(id);
      }
    }
  }

  // Fallback: extract from raw JSON parsing if json_extract didn't work
  if (playerIds.size === 0) {
    const rows = await client.execute(`SELECT raw_json FROM sap_match_lineups`);
    for (const row of rows.rows) {
      const data = JSON.parse(row.raw_json as string) as {
        homeTeam?: { players?: { player?: { id?: number } }[] };
        awayTeam?: { players?: { player?: { id?: number } }[] };
      };
      for (const p of data.homeTeam?.players || []) {
        if (p.player?.id) playerIds.add(p.player.id);
      }
      for (const p of data.awayTeam?.players || []) {
        if (p.player?.id) playerIds.add(p.player.id);
      }
    }
  }

  log("fetch-players", `Found ${playerIds.size} unique players from lineups`);
  let stored = 0;
  for (const playerId of playerIds) {
    try {
      const detail = await getPlayerDetails(playerId);
      await storeSAPPlayer(String(playerId), detail);
      stored++;
    } catch (err) {
      log("fetch-players", `Error fetching player ${playerId}: ${err}`);
    }
  }
  log("fetch-players", `Stored ${stored} players`);
}
