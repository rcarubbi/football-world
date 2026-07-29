import { getStandings, getTeamForm, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDTeamForm } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTeamForm(leagues: string[], _season: number) {
  const seen = new Set<string>();
  for (const slug of leagues) {
    const leagueId = getBBSLeagueId(slug);
    if (!leagueId) continue;
    try {
      const rows = await getStandings(leagueId);
      for (const row of rows) {
        const teamId = String(row.team_id || "");
        if (teamId) seen.add(teamId);
      }
    } catch (err) {
      log("fetch-team-form", `Error getting team IDs for ${slug}: ${err}`);
    }
  }
  log("fetch-team-form", `Fetching form for ${seen.size} teams`);
  let stored = 0;
  for (const teamId of seen) {
    try {
      const form = await getTeamForm(teamId);
      await storeBBDTeamForm(teamId, form);
      stored++;
    } catch (err) {
      log("fetch-team-form", `Error fetching form for ${teamId}: ${err}`);
    }
  }
  log("fetch-team-form", `Stored ${stored} team forms`);
}
