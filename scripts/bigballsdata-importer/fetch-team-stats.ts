import { getStandings, getTeamStats, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDTeamStats } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTeamStats(leagues: string[], _season: number) {
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
      log("fetch-team-stats", `Error getting team IDs for ${slug}: ${err}`);
    }
  }
  log("fetch-team-stats", `Fetching stats for ${seen.size} teams`);
  let stored = 0;
  for (const teamId of seen) {
    try {
      const stats = await getTeamStats(teamId);
      await storeBBDTeamStats(teamId, stats);
      stored++;
    } catch (err) {
      log("fetch-team-stats", `Error fetching stats for ${teamId}: ${err}`);
    }
  }
  log("fetch-team-stats", `Stored ${stored} team stats`);
}
