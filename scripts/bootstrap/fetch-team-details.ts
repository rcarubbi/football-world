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
    sql: `SELECT id, name, league_slug, badge_url, stadium, location, founded, thesportsdb_id
          FROM teams
          WHERE badge_url IS NULL OR badge_url = ''
             OR stadium IS NULL OR stadium = ''
             OR location IS NULL OR location = ''
             OR founded IS NULL OR founded = ''
             OR thesportsdb_id IS NULL`,
    args: [],
  });

  console.log(`  ${teams.rows.length} teams need detail enrichment`);

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
          thesportsdb_id = COALESCE(NULLIF(thesportsdb_id, ''), ?),
          badge_url = COALESCE(NULLIF(badge_url, ''), ?),
          stadium = COALESCE(NULLIF(stadium, ''), ?),
          location = COALESCE(NULLIF(location, ''), ?),
          founded = COALESCE(NULLIF(founded, ''), ?),
          wikipedia_content = COALESCE(NULLIF(wikipedia_content, ''), ?)
        WHERE id = ?`,
        args: [
          match.idTeam || null,
          match.strBadge || null,
          match.strStadium || null,
          match.strLocation || null,
          match.intFormedYear || null,
          match.strDescriptionEN || null,
          team.id,
        ],
      });

      console.log(`    badge:${match.strBadge ? "yes" : "no"} | stadium:${match.strStadium || "-"} | loc:${match.strLocation || "-"} | founded:${match.intFormedYear || "-"}`);
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") {
        console.log("    Rate limited! Stopping. Re-run to resume.");
        break;
      }
      console.error(`    Error: ${(error as Error).message}`);
    }
  }
}
