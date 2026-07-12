import { LEAGUES } from "../../src/lib/leagues";
import { getTursoClient } from "../../src/lib/turso/client";

interface FootballDataStanding {
  stage: string;
  table: Array<{
    position: number;
    team: { id: number; name: string; tla: string; crest: string };
  }>;
}

export async function fetchWorldCupTeams(): Promise<void> {
  const client = getTursoClient();
  const worldCupLeague = LEAGUES.find((l) => l.slug === "fifa-world-cup");

  if (!worldCupLeague) {
    console.log("  World Cup league not found in config");
    return;
  }

  console.log("  Fetching World Cup teams from football-data.org...");

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${worldCupLeague.footballDataCode}/standings`,
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      console.error(`  Football-data.org API error: ${response.status}`);
      return;
    }

    const data = await response.json();
    const standings = data.standings as FootballDataStanding[];

    if (!standings || standings.length === 0) {
      console.log("  No World Cup standings returned");
      return;
    }

    // Find or create world_cups record for the current year
    const now = new Date();
    const wcYear = now.getFullYear();

    const existing = await client.execute({
      sql: "SELECT id FROM world_cups WHERE year = ?",
      args: [wcYear],
    });

    let worldCupId: number;
    if (existing.rows.length > 0) {
      worldCupId = existing.rows[0].id as number;
    } else {
      const insertResult = await client.execute({
        sql: `INSERT INTO world_cups (year, host_country) VALUES (?, ?)`,
        args: [wcYear, "International"],
      });
      worldCupId = Number(insertResult.lastInsertRowid);
    }

    let count = 0;
    for (const standing of standings) {
      const groupName = standing.stage || "GROUP_STAGE";

      for (const entry of standing.table) {
        await client.execute({
          sql: `INSERT INTO world_cup_teams (
            world_cup_id, team_name, fifa_code, badge_url, group_name
          ) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            badge_url = COALESCE(excluded.badge_url, world_cup_teams.badge_url)`,
          args: [
            worldCupId,
            entry.team.name,
            entry.team.tla,
            entry.team.crest,
            groupName,
          ],
        });
        count++;
      }
    }

    console.log(`  Fetched ${count} World Cup teams for ${wcYear}`);
  } catch (error) {
    console.error("  Error fetching World Cup teams:", error);
  }
}
