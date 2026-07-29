import { getStandings } from "../../src/lib/api/sportsapipro";
import { storeSAPStandings } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchStandings(
  leagues: { sapTournamentId: number; sapSeasonId: number; name: string }[]
) {
  for (const league of leagues) {
    log("fetch-standings", `Fetching standings for ${league.name}`);
    try {
      const data = await getStandings(league.sapTournamentId, league.sapSeasonId);
      await storeSAPStandings(league.sapTournamentId, league.sapSeasonId, data);
      log("fetch-standings", `Stored standings for ${league.name}`);
    } catch (err) {
      log("fetch-standings", `Error fetching standings for ${league.name}: ${err}`);
    }
  }
}
