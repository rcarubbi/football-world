import { getStandings, getTeamElo, getBBSLeagueId } from "../../src/lib/api/bigballs";
import { storeBBDTeamElo } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTeamElo(leagues: string[], _season: number) {
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
      log("fetch-team-elo", `Error getting team IDs for ${slug}: ${err}`);
    }
  }
  log("fetch-team-elo", `Fetching elo for ${seen.size} teams`);
  let stored = 0;
  for (const teamId of seen) {
    try {
      const elo = await getTeamElo(teamId);
      await storeBBDTeamElo(teamId, elo);
      stored++;
    } catch (err) {
      log("fetch-team-elo", `Error fetching elo for ${teamId}: ${err}`);
    }
  }
  log("fetch-team-elo", `Stored ${stored} team elo`);
}
