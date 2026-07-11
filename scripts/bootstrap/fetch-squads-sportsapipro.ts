import { searchTeam, getTeamSquad } from "../../src/lib/api/sportsapipro";
import { getTursoClient } from "../../src/lib/turso/client";

const POS_MAP: Record<string, string> = {
  G: "Goalkeeper",
  D: "Defender",
  M: "Midfielder",
  F: "Attacker",
  GK: "Goalkeeper",
  DF: "Defender",
  MF: "Midfielder",
  FW: "Attacker",
};

function normalizePos(pos: string): string {
  return POS_MAP[pos] || pos;
}

export async function fetchSquadsSportsAPIPro(): Promise<void> {
  const client = getTursoClient();
  const teams = await client.execute({
    sql: `SELECT id, name, league_slug FROM teams ORDER BY league_slug, name`,
    args: [],
  });

  let teamsProcessed = 0;
  let skipped = 0;
  let notFound = 0;
  let playersSaved = 0;
  let rateLimited = false;

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

    if (rateLimited) break;

    try {
      const teamId = team.id as number;
      const teamName = team.name as string;

      // Step 1: Search for team ID
      console.log(`    Searching: ${teamName}...`);
      const found = await searchTeam(teamName);
      if (!found) {
        console.log(`    Not found`);
        notFound++;
        continue;
      }

      // Save sportsapipro_id on team
      await client.execute({
        sql: `UPDATE teams SET sportsapipro_id = ? WHERE id = ?`,
        args: [found.id.toString(), teamId],
      });

      // Step 2: Fetch squad
      console.log(`    ID: ${found.id}, fetching squad...`);
      const players = await getTeamSquad(found.id);

      if (players.length === 0) {
        console.log(`    0 players`);
        notFound++;
        continue;
      }

      for (const p of players) {
        const nationality = p.country?.name || null;
        const pos = normalizePos(p.position);

        await client.execute({
          sql: `INSERT INTO players (
            name, slug, team_id, position, nationality, date_of_birth, height
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            position = COALESCE(excluded.position, players.position),
            nationality = COALESCE(excluded.nationality, players.nationality),
            date_of_birth = COALESCE(excluded.date_of_birth, players.date_of_birth),
            height = COALESCE(excluded.height, players.height),
            updated_at = datetime('now')`,
          args: [
            p.name,
            p.slug,
            teamId,
            pos,
            nationality,
            p.dateOfBirth || null,
            p.height || null,
          ],
        });
        playersSaved++;
      }

      console.log(`    ${players.length} players saved`);
      teamsProcessed++;
    } catch (error) {
      const msg = (error as Error).message;
      if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit") || msg.includes("Max retries")) {
        console.log("\n  Rate limited! Stop and re-run to resume.");
        rateLimited = true;
      } else {
        console.error(`    Error: ${msg}`);
      }
    }

    // Small delay between teams
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(
    `\n  Done: ${teamsProcessed} teams, ${skipped} skipped, ${notFound} not found, ${playersSaved} players saved`
  );
}
