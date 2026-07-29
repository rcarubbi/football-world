import { getStandings, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDStandings } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchStandings(leagues: string[], season: number) {
  for (const slug of leagues) {
    const leagueId = getBBSLeagueId(slug);
    if (!leagueId) {
      log("fetch-standings", `Unknown league: ${slug}, skipping`);
      continue;
    }
    log("fetch-standings", `Fetching standings for ${slug} (${leagueId}) season=${season}`);
    try {
      const standings = await getStandings(leagueId);
      await storeBBDStandings(leagueId, String(season), standings);
      log("fetch-standings", `Stored standings for ${slug}`);
    } catch (err) {
      log("fetch-standings", `Error fetching ${slug}: ${err}`);
    }
  }
}
