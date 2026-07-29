import { getTopScorers, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDScorers } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

const CATEGORIES = ["goals", "assists", "minutes", "matches"] as const;

export async function fetchScorers(leagues: string[]) {
  for (const slug of leagues) {
    const leagueId = getBBSLeagueId(slug);
    if (!leagueId) {
      log("fetch-scorers", `Unknown league: ${slug}, skipping`);
      continue;
    }
    log("fetch-scorers", `Fetching scorers for ${slug} (${leagueId})`);
    for (const category of CATEGORIES) {
      try {
        const scorers = await getTopScorers(leagueId, 2025, 50, category);
        await storeBBDScorers(leagueId, String(2025), category, scorers);
        log("fetch-scorers", `Stored ${category} scorers for ${slug}`);
      } catch (err) {
        log("fetch-scorers", `Error fetching ${category} for ${slug}: ${err}`);
      }
    }
  }
}
