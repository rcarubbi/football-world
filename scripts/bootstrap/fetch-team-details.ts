import { lookupTeam } from "../../src/lib/api/sportsdb";
import { findAllTeams, upsertTeam } from "../../src/lib/db/teams";

interface SportsDBTeamDetail {
  idTeam: string;
  strTeam: string;
  strBadge: string | null;
  strKit: string | null;
  strKit2: string | null;
  strKit3: string | null;
  intFormedYear: string | null;
  strStadium: string | null;
  strLocation: string | null;
  strDescriptionEN: string | null;
}

export async function fetchTeamDetails(): Promise<void> {
  const teams = await findAllTeams();

  for (const team of teams) {
    if (!team.thesportsdb_id) continue;

    const details = (await lookupTeam(
      team.thesportsdb_id
    )) as SportsDBTeamDetail | null;

    if (details) {
      await upsertTeam({
        id: team.id,
        thesportsdb_id: team.thesportsdb_id,
        name: team.name,
        slug: team.slug,
        badge_url: details.strBadge,
        kit_home_url: details.strKit,
        kit_away_url: details.strKit2,
        kit_third_url: details.strKit3,
        founded: details.intFormedYear,
        stadium: details.strStadium,
        location: details.strLocation,
        league_slug: team.league_slug,
      });
    }
  }
}
