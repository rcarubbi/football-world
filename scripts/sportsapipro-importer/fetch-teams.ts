import { getTournamentTeams, getTeamDetails } from "../../src/lib/api/sportsapipro";
import { storeSAPTeam } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTeams(
  leagues: { sapTournamentId: number; sapSeasonId: number; name: string }[]
) {
  const seen = new Set<number>();
  for (const league of leagues) {
    log("fetch-teams", `Fetching tournament teams for ${league.name}`);
    try {
      const data = await getTournamentTeams(league.sapTournamentId, league.sapSeasonId) as {
        teams?: { id?: number; name?: string; team?: { id?: number } }[];
      } | null;
      const teams = data?.teams || [];
      for (const t of teams) {
        const id = t.id || t.team?.id;
        if (id) seen.add(id);
      }
    } catch (err) {
      log("fetch-teams", `Error fetching tournament teams for ${league.name}: ${err}`);
    }
  }
  log("fetch-teams", `Fetching details for ${seen.size} teams`);
  let stored = 0;
  for (const teamId of seen) {
    try {
      const detail = await getTeamDetails(teamId);
      await storeSAPTeam(String(teamId), detail);
      stored++;
    } catch (err) {
      log("fetch-teams", `Error fetching team ${teamId}: ${err}`);
    }
  }
  log("fetch-teams", `Stored ${stored} teams`);
}
