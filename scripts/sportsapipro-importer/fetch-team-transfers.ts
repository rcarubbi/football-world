import { getTournamentTeams, getTeamTransfers } from "../../src/lib/api/sportsapipro";
import { storeSAPTeamTransfers } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTeamTransfers(
  leagues: { sapTournamentId: number; sapSeasonId: number; name: string }[]
) {
  const seen = new Set<number>();
  for (const league of leagues) {
    try {
      const data = await getTournamentTeams(league.sapTournamentId, league.sapSeasonId) as {
        teams?: { id?: number; team?: { id?: number } }[];
      } | null;
      const teams = data?.teams || [];
      for (const t of teams) {
        const id = t.id || t.team?.id;
        if (id) seen.add(id);
      }
    } catch (err) {
      log("fetch-team-transfers", `Error getting team IDs for ${league.name}: ${err}`);
    }
  }
  log("fetch-team-transfers", `Fetching transfers for ${seen.size} teams`);
  let stored = 0;
  for (const teamId of seen) {
    try {
      const transfers = await getTeamTransfers(teamId);
      await storeSAPTeamTransfers(String(teamId), transfers);
      stored++;
    } catch (err) {
      log("fetch-team-transfers", `Error fetching transfers for ${teamId}: ${err}`);
    }
  }
  log("fetch-team-transfers", `Stored ${stored} team transfers`);
}
