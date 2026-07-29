import { getPlayers, getPlayerStats, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDPlayerStats } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchPlayerStats(leagues: string[], season: number) {
  log("fetch-player-stats", "Fetching paginated players for stats");
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
  const bbsLeagueIds = leagues.map(s => getBBSLeagueId(s)).filter((id): id is string => id !== null);
  log("fetch-player-stats", `Fetching stats for ${playerIds.length} players across ${bbsLeagueIds.length} leagues`);
  let stored = 0;
  for (const playerId of playerIds) {
    for (const leagueId of bbsLeagueIds) {
      try {
        const stats = await getPlayerStats(playerId, leagueId, season);
        await storeBBDPlayerStats(playerId, leagueId, season, stats);
        stored++;
      } catch (err) {
        log("fetch-player-stats", `Error fetching stats for ${playerId}/${leagueId}: ${err}`);
      }
    }
  }
  log("fetch-player-stats", `Stored ${stored} player stats`);
}
