import { getTursoClient } from "../../src/lib/turso/client";

interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort: string;
  strAlternate: string;
  intFormedYear: string;
  strStadium: string;
  strDescriptionEN: string;
  strBadge: string;
  strKit: string;
  strCountry: string;
}

export async function fetchWorldCupTeams(): Promise<void> {
  const client = getTursoClient();

  console.log("  Fetching World Cup teams from TheSportsDB...");

  try {
    const response = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=World%20Cup`
    );

    if (!response.ok) {
      console.error(`  TheSportsDB API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const teams = data.teams as TheSportsDBTeam[] | null;

    if (!teams || teams.length === 0) {
      console.log("  No World Cup teams found");
      return;
    }

    let count = 0;
    for (const team of teams.slice(0, 50)) {
      await client.execute({
        sql: `INSERT INTO world_cup_teams (
          thesportsdb_id, name, short_name, formed_year, stadium,
          description, badge_url, kit_url, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(thesportsdb_id) DO UPDATE SET
          name = excluded.name,
          short_name = excluded.short_name,
          badge_url = COALESCE(excluded.badge_url, world_cup_teams.badge_url),
          kit_url = COALESCE(excluded.kit_url, world_cup_teams.kit_url)`,
        args: [
          team.idTeam,
          team.strTeam,
          team.strTeamShort || team.strAlternate,
          team.intFormedYear ? parseInt(team.intFormedYear) : null,
          team.strStadium,
          team.strDescriptionEN,
          team.strBadge,
          team.strKit,
          team.strCountry,
        ],
      });
      count++;
    }

    console.log(`  Fetched ${count} World Cup teams`);
  } catch (error) {
    console.error("  Error fetching World Cup teams:", error);
  }
}
