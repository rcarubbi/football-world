import { getTournamentTeams, getTeamSquad } from "../../src/lib/api/sportsapipro";
import { storeSAPSquad } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchSquads(
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
      log("fetch-squads", `Error getting team IDs for ${league.name}: ${err}`);
    }
  }
  log("fetch-squads", `Fetching squads for ${seen.size} teams`);
  let stored = 0;
  for (const teamId of seen) {
    try {
      const squad = await getTeamSquad(teamId);
      await storeSAPSquad(String(teamId), squad);
      stored++;
    } catch (err) {
      log("fetch-squads", `Error fetching squad for ${teamId}: ${err}`);
    }
  }
  log("fetch-squads", `Stored ${stored} squads`);
}
