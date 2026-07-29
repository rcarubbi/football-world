import { getPlayers, getPlayerTrophies } from "../../src/lib/api/bigballs";
import { storeBBDPlayerTrophies } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayerTrophies() {
  log("fetch-player-trophies", "Fetching paginated players for trophies");
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
  log("fetch-player-trophies", `Fetching trophies for ${playerIds.length} players`);
  let stored = 0;
  for (const playerId of playerIds) {
    try {
      const trophies = await getPlayerTrophies(playerId);
      await storeBBDPlayerTrophies(playerId, trophies);
      stored++;
    } catch (err) {
      log("fetch-player-trophies", `Error fetching trophies for ${playerId}: ${err}`);
    }
  }
  log("fetch-player-trophies", `Stored ${stored} player trophies`);
}
