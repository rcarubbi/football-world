import { searchTeams, lookupAllPlayers } from "../../src/lib/api/sportsdb";
import { getTursoClient } from "../../src/lib/turso/client";

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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function lookupPlayersForTeam(
  client: ReturnType<typeof getTursoClient>,
  team: { id: number | bigint; name: string; thesportsdb_id: string | null },
  playersSaved: { value: number }
): Promise<boolean> {
  let teamId = team.thesportsdb_id;

  // Step 1: If no cached TSDB ID, search for it (1 API call)
  if (!teamId) {
    console.log(`    Searching TheSportsDB for ${team.name}...`);
    const results = (await searchTeams(team.name)) as SportsDBTeam[];

    if (results.length === 0) {
      console.log(`    Team not found`);
      return true; // continue to next team
    }

    const match = results.find(
      (r) =>
        r.strTeam.toLowerCase().includes(team.name.toLowerCase().split(" ")[0]) ||
        team.name.toLowerCase().includes(r.strTeam.toLowerCase().split(" ")[0])
    ) || results[0];

    teamId = match.idTeam;

    // Save TSDB ID on team for future runs
    await client.execute({
      sql: `UPDATE teams SET thesportsdb_id = ? WHERE id = ?`,
      args: [teamId, team.id],
    });
    console.log(`    Found TSDB ID: ${teamId}`);
  }

  // Step 2: Lookup all players (1 API call)
  console.log(`    Fetching players (TSDB: ${teamId})...`);
  const players = (await lookupAllPlayers(teamId)) as SportsDBPlayer[];

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
    playersSaved.value++;
  }

  console.log(`    ${activePlayers.length} active players saved`);
  return true;
}

export async function fetchSquadsSportsDB(): Promise<void> {
  const client = getTursoClient();
  const teams = await client.execute({
    sql: `SELECT id, name, league_slug, thesportsdb_id FROM teams ORDER BY league_slug, name`,
    args: [],
  });

  let teamsProcessed = 0;
  const playersSaved = { value: 0 };
  let skipped = 0;

  for (const team of teams.rows) {
    // Skip teams that already have players
    const existing = await client.execute({
      sql: `SELECT COUNT(*) as n FROM players WHERE team_id = ?`,
      args: [team.id],
    });
    if ((existing.rows[0].n as number) > 0) {
      skipped++;
      continue;
    }

    try {
      // This makes 1-2 API calls per team (search if no cached ID + players)
      await lookupPlayersForTeam(
        client,
        {
          id: team.id as number,
          name: team.name as string,
          thesportsdb_id: (team.thesportsdb_id as string) || null,
        },
        playersSaved
      );
      teamsProcessed++;
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") {
        console.log("\n  Rate limited! Stopping. Re-run bootstrap to resume.");
        break;
      }
      console.error(`    Error: ${(error as Error).message}`);
    }

    // Small delay between teams
    await sleep(2000);
  }

  console.log(
    `\n  Done: ${teamsProcessed} teams processed, ${skipped} skipped, ${playersSaved.value} players saved`
  );
}
