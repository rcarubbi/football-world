import { getPlayers } from "../../src/lib/api/bigballs";
import { storeBBDPlayers } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayers(leagues?: string[]) {
  const PAGE_SIZE = 100;
  let offset = 0;
  let total = 0;
  let stored = 0;
  const leagueId = leagues?.[0] || "";

  log("fetch-players", `Fetching all players (paginated) for league=${leagueId || "global"}`);
  while (true) {
    const { players, total: newTotal } = await getPlayers({ limit: PAGE_SIZE, offset });
    if (total === 0) total = newTotal;
    if (!players.length) break;

    for (const player of players) {
      const p = player as { id?: string | number };
      if (p.id) {
        await storeBBDPlayers(String(p.id), leagueId, player);
        stored++;
      }
    }
    offset += PAGE_SIZE;
    if (offset >= total) break;
  }
  log("fetch-players", `Stored ${stored} players`);
}
