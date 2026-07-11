import { searchTeams, lookupAllPlayers } from "../../src/lib/api/sportsdb";
import { getTursoClient } from "../../src/lib/turso/client";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface SportsDBPlayer {
  idPlayer: string;
  idTeam: string;
  strPlayer: string;
  strNationality: string;
  strPosition: string;
  dateBorn: string;
  strHeight: string;
  strWeight: string;
  strThumb: string;
  strCutout: string;
  strRender: string;
  strDescriptionEN: string;
  strNumber: string;
  strStatus: string;
  strSide: string;
}

interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
}

export async function fetchSquadsSportsDB(): Promise<void> {
  const client = getTursoClient();
  const teams = await client.execute({
    sql: `SELECT id, name, league_slug FROM teams ORDER BY league_slug, name`,
    args: [],
  });

  let teamsFound = 0;
  let playersSaved = 0;

  for (const team of teams.rows) {
    console.log(`  Searching TheSportsDB for ${team.name}...`);

    try {
      const results = (await searchTeams(team.name as string)) as SportsDBTeam[];

      if (results.length === 0) {
        console.log(`    Team not found`);
        continue;
      }

      const match = results.find(
        (r) =>
          r.strTeam.toLowerCase().includes((team.name as string).toLowerCase().split(" ")[0]) ||
          (team.name as string).toLowerCase().includes(r.strTeam.toLowerCase().split(" ")[0])
      ) || results[0];

      const players = (await lookupAllPlayers(match.idTeam)) as SportsDBPlayer[];

      const activePlayers = players.filter(
        (p) => p.strStatus === "Active" && p.strPlayer && p.strPlayer.trim() !== ""
      );

      for (const p of activePlayers) {
        const nationality = p.strNationality || null;
        const height = p.strHeight || null;
        const weight = p.strWeight || null;
        const photo = p.strCutout || p.strThumb || p.strRender || null;
        const description = p.strDescriptionEN || null;

        await client.execute({
          sql: `INSERT INTO players (
            thesportsdb_id, name, slug, team_id, position,
            nationality, date_of_birth, height, weight, photo_url, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            thesportsdb_id = COALESCE(excluded.thesportsdb_id, players.thesportsdb_id),
            position = COALESCE(excluded.position, players.position),
            nationality = COALESCE(excluded.nationality, players.nationality),
            date_of_birth = COALESCE(excluded.date_of_birth, players.date_of_birth),
            height = COALESCE(excluded.height, players.height),
            weight = COALESCE(excluded.weight, players.weight),
            photo_url = COALESCE(excluded.photo_url, players.photo_url),
            description = COALESCE(excluded.description, players.description),
            updated_at = datetime('now')`,
          args: [
            p.idPlayer,
            p.strPlayer,
            slugify(p.strPlayer),
            team.id,
            p.strPosition || null,
            nationality,
            p.dateBorn || null,
            height,
            weight,
            photo,
            description,
          ],
        });
        playersSaved++;
      }

      teamsFound++;
      console.log(`    ${activePlayers.length} active players`);
    } catch (error) {
      console.error(`    Error: ${(error as Error).message}`);
    }
  }

  console.log(`\n  Total: ${teamsFound} teams found, ${playersSaved} players saved`);
}
