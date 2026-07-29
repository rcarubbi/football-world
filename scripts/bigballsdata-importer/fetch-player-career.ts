import { getPlayers, getPlayerCareer } from "../../src/lib/api/bigballs";
import { storeBBDPlayerCareer } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayerCareer() {
  log("fetch-player-career", "Fetching paginated players for career");
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
  log("fetch-player-career", `Fetching career for ${playerIds.length} players`);
  let stored = 0;
  for (const playerId of playerIds) {
    try {
      const career = await getPlayerCareer(playerId);
      await storeBBDPlayerCareer(playerId, career);
      stored++;
    } catch (err) {
      log("fetch-player-career", `Error fetching career for ${playerId}: ${err}`);
    }
  }
  log("fetch-player-career", `Stored ${stored} player careers`);
}
