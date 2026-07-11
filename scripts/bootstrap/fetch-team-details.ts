import { searchTeams } from "../../src/lib/api/sportsdb";
import { getTursoClient } from "../../src/lib/turso/client";

interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strBadge: string;
  strLogo: string;
  strBanner: string;
  strEquipment: string;
  strDescriptionEN: string;
  strStadium: string;
  strLocation: string;
  intStadiumCapacity: string;
  intFormedYear: string;
  strColour1: string;
  strColour2: string;
  strColour3: string;
  strCountry: string;
  strKeywords: string;
}

export async function fetchTeamDetails(): Promise<void> {
  const client = getTursoClient();
  const teams = await client.execute({
    sql: `SELECT id, name, league_slug, badge_url FROM teams WHERE badge_url IS NULL OR badge_url = ''`,
    args: [],
  });

  for (const team of teams.rows) {
    console.log(`  Searching TheSportsDB for ${team.name}...`);

    try {
      const results = (await searchTeams(team.name as string)) as SportsDBTeam[];

      if (results.length === 0) {
        console.log(`    Not found`);
        continue;
      }

      const match = results.find(
        (r) =>
          r.strTeam.toLowerCase().includes((team.name as string).toLowerCase().split(" ")[0]) ||
          (team.name as string).toLowerCase().includes(r.strTeam.toLowerCase().split(" ")[0])
      ) || results[0];

      await client.execute({
        sql: `UPDATE teams SET
          badge_url = COALESCE(badge_url, ?),
          stadium = COALESCE(NULLIF(stadium, ''), ?),
          location = COALESCE(NULLIF(location, ''), ?),
          founded = COALESCE(NULLIF(founded, ''), ?)
        WHERE id = ?`,
        args: [
          match.strBadge || null,
          match.strStadium || null,
          match.strLocation || null,
          match.intFormedYear || null,
          team.id,
        ],
      });

      console.log(`    Found: ${match.strBadge ? "badge" : "no badge"} | ${match.strStadium || "no stadium"}`);
    } catch (error) {
      console.error(`    Error: ${(error as Error).message}`);
    }
  }
}
