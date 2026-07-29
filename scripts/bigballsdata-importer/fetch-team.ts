import { getStandings, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDTeams } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTeams(leagues: string[], _season: number) {
  let stored = 0;
  for (const slug of leagues) {
    const leagueId = getBBSLeagueId(slug);
    if (!leagueId) continue;
    log("fetch-team", `Fetching standings to extract teams for ${slug}`);
    try {
      const rows = await getStandings(leagueId);
      for (const row of rows) {
        const teamId = row.team_id;
        if (!teamId) continue;
        const team = {
          id: teamId,
          name: row.team_name,
          logo_url: row.logo_url,
          sport: "football",
          league: slug,
        };
        await storeBBDTeams(teamId, leagueId, team);
        stored++;
      }
    } catch (err) {
      log("fetch-team", `Error getting standings for ${slug}: ${err}`);
    }
  }
  log("fetch-team", `Stored ${stored} teams`);
}
