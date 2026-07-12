import { LEAGUES } from "../../src/lib/leagues";
import { getTursoClient } from "../../src/lib/turso/client";

interface FootballDataMatch {
  id: number;
  matchday: number;
  stage: string;
  group: string | null;
  status: string;
  utcDate: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
  venue: string | null;
}

export async function fetchWorldCup(): Promise<void> {
  const client = getTursoClient();
  const worldCupLeague = LEAGUES.find((l) => l.slug === "fifa-world-cup");

  if (!worldCupLeague) {
    console.log("  World Cup league not found in config");
    return;
  }

  console.log("  Fetching World Cup data from football-data.org...");

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/competitions/${worldCupLeague.footballDataCode}/matches`,
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
    const matches = data.matches as FootballDataMatch[];

    if (!matches || matches.length === 0) {
      console.log("  No World Cup matches returned");
      return;
    }

    // Determine year from first match
    const firstDate = new Date(matches[0].utcDate);
    const wcYear = firstDate.getFullYear();

    // Upsert world_cups parent record
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
        args: [wcYear, data.competition?.area?.name || "International"],
      });
      worldCupId = Number(insertResult.lastInsertRowid);
    }

    // Insert matches
    let count = 0;
    for (const match of matches) {
      const matchDate = new Date(match.utcDate);

      // Skip duplicates
      const existing = await client.execute({
        sql: `SELECT id FROM world_cup_matches
              WHERE world_cup_id = ? AND home_team = ? AND away_team = ? AND match_date = ?`,
        args: [worldCupId, match.homeTeam.name, match.awayTeam.name, matchDate.toISOString().split("T")[0]],
      });

      if (existing.rows.length > 0) {
        // Update score if match is finished
        if (match.status === "FINISHED") {
          await client.execute({
            sql: `UPDATE world_cup_matches SET home_score = ?, away_score = ?, venue = COALESCE(?, venue)
                  WHERE id = ?`,
            args: [
              match.score.fullTime.home,
              match.score.fullTime.away,
              match.venue,
              existing.rows[0].id as number,
            ],
          });
        }
        continue;
      }

      await client.execute({
        sql: `INSERT INTO world_cup_matches (
          world_cup_id, stage, group_name, home_team, away_team,
          home_score, away_score, venue, match_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          worldCupId,
          match.stage || null,
          match.group || null,
          match.homeTeam.name,
          match.awayTeam.name,
          match.score.fullTime.home,
          match.score.fullTime.away,
          match.venue,
          matchDate.toISOString().split("T")[0],
        ],
      });
      count++;
    }

    console.log(`  Fetched ${count} World Cup matches for ${wcYear}`);
  } catch (error) {
    console.error("  Error fetching World Cup data:", error);
  }
}
