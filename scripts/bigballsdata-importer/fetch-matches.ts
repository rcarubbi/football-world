import { getMatches, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDMatches } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatches(leagues: string[], season: number) {
  for (const slug of leagues) {
    const leagueId = getBBSLeagueId(slug);
    if (!leagueId) {
      log("fetch-matches", `Unknown league: ${slug}, skipping`);
      continue;
    }
    log("fetch-matches", `Fetching matches for ${slug} (${leagueId}) season=${season}`);
    try {
      const matches = await getMatches(leagueId, { status: "finished" });
      await storeBBDMatches(leagueId, String(season), matches);
      log("fetch-matches", `Stored ${Array.isArray(matches) ? matches.length : 0} matches for ${slug}`);
    } catch (err) {
      log("fetch-matches", `Error fetching matches for ${slug}: ${err}`);
    }
  }
}
