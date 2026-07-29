import { getPlayers, getPlayerTransfers } from "../../src/lib/api/bigballs";
import { storeBBDPlayerTransfers } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayerTransfers() {
  log("fetch-player-transfers", "Fetching paginated players for transfers");
  const PAGE_SIZE = 100;
  let offset = 0;
  let total = 0;
  const playerIds: string[] = [];

  while (true) {
    const { players, total: newTotal } = await getPlayers({ limit: PAGE_SIZE, offset });
    if (total === 0) total = newTotal;
    if (!players.length) break;
    for (const p of players) {
      const pid = (p as { id?: string | number }).id;
      if (pid) playerIds.push(String(pid));
    }
    offset += PAGE_SIZE;
    if (offset >= total) break;
  }
  log("fetch-player-transfers", `Fetching transfers for ${playerIds.length} players`);
  let stored = 0;
  for (const playerId of playerIds) {
    try {
      const transfers = await getPlayerTransfers(playerId);
      await storeBBDPlayerTransfers(playerId, transfers);
      stored++;
    } catch (err) {
      log("fetch-player-transfers", `Error fetching transfers for ${playerId}: ${err}`);
    }
  }
  log("fetch-player-transfers", `Stored ${stored} player transfers`);
}
