import { getTopPlayers } from "../../src/lib/api/sportsapipro";
import { storeSAPTopPlayers } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTopPlayers(
  leagues: { sapTournamentId: number; sapSeasonId: number; name: string }[]
) {
  for (const league of leagues) {
    log("fetch-top-players", `Fetching top players for ${league.name}`);
    try {
      const data = await getTopPlayers(league.sapTournamentId, league.sapSeasonId);
      await storeSAPTopPlayers(league.sapTournamentId, league.sapSeasonId, data);
      log("fetch-top-players", `Stored top players for ${league.name}`);
    } catch (err) {
      log("fetch-top-players", `Error fetching top players for ${league.name}: ${err}`);
    }
  }
}
