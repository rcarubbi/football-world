import { getTeamsByLeague, getSquad } from "../../src/lib/api/api-football";
import { LEAGUES } from "../../src/lib/leagues";
import { getTursoClient } from "../../src/lib/turso/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchSquads(): Promise<void> {
  const client = getTursoClient();

  for (const league of LEAGUES) {
    if (league.apiFootballId === 1) continue; // Skip World Cup
    console.log(`  Fetching API-Football team IDs for ${league.name}...`);

    try {
      // Free tier only allows seasons 2022-2024 for team lookup
      const apiTeams = await getTeamsByLeague(league.apiFootballId, 2024);

      for (const apiTeam of apiTeams) {
        // Update team with API-Football ID
        await client.execute({
          sql: `UPDATE teams SET apifootball_id = ? WHERE name = ? AND league_slug = ?`,
          args: [apiTeam.team.id.toString(), apiTeam.team.name, league.slug],
        });
      }

      console.log(`  Found ${apiTeams.length} teams in API-Football`);

      // Fetch squads for each team in this league (skip already fetched)
      const dbTeams = await client.execute({
        sql: `SELECT id, name, apifootball_id FROM teams WHERE league_slug = ? AND apifootball_id IS NOT NULL AND id NOT IN (SELECT DISTINCT team_id FROM players WHERE team_id IS NOT NULL)`,
        args: [league.slug],
      });

      for (const team of dbTeams.rows) {
        const teamId = parseInt(team.apifootball_id as string);
        console.log(`    Fetching squad for ${team.name}...`);

        try {
          const players = await getSquad(teamId);

          for (const p of players) {
            const nationality = Array.isArray(p.nationality)
              ? p.nationality.join(", ")
              : (p.nationality as unknown as string) || null;

            await client.execute({
              sql: `INSERT INTO players (
                apifootball_id, name, slug, team_id, position,
                nationality, height, weight, photo_url
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                apifootball_id = excluded.apifootball_id,
                team_id = excluded.team_id,
                position = excluded.position,
                nationality = COALESCE(excluded.nationality, players.nationality),
                height = COALESCE(excluded.height, players.height),
                weight = COALESCE(excluded.weight, players.weight),
                photo_url = COALESCE(excluded.photo_url, players.photo_url),
                updated_at = datetime('now')`,
              args: [
                p.id.toString(),
                p.name,
                slugify(p.name),
                team.id,
                p.position || null,
                nationality,
                p.height || null,
                p.weight || null,
                p.photo || null,
              ],
            });
          }

          console.log(`      ${players.length} players`);
        } catch (error) {
          console.error(`      Error: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      console.error(`  Error for ${league.name}: ${(error as Error).message}`);
    }
  }
}
