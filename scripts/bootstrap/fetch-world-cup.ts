import { LEAGUES } from "../../src/lib/leagues";
import { getTursoClient } from "../../src/lib/turso/client";

interface FootballDataMatch {
  id: number;
  matchday: number;
  stage: string;
  status: string;
  utcDate: string;
  homeTeam: { id: number; name: string; nationalTeam: boolean };
  awayTeam: { id: number; name: string; nationalTeam: boolean };
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

    let count = 0;
    for (const match of matches) {
      await client.execute({
        sql: `INSERT INTO world_cup_matches (
          football_data_id, matchday, stage, status, match_date,
          home_team_name, home_score, away_team_name, away_score, venue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(football_data_id) DO UPDATE SET
          matchday = excluded.matchday,
          stage = excluded.stage,
          status = excluded.status,
          home_score = excluded.home_score,
          away_score = excluded.away_score,
          venue = COALESCE(excluded.venue, world_cup_matches.venue)`,
        args: [
          match.id.toString(),
          match.matchday,
          match.stage,
          match.status,
          new Date(match.utcDate).toISOString().split("T")[0],
          match.homeTeam.name,
          match.score.fullTime.home,
          match.awayTeam.name,
          match.score.fullTime.away,
          match.venue,
        ],
      });
      count++;
    }

    console.log(`  Fetched ${count} World Cup matches`);
  } catch (error) {
    console.error("  Error fetching World Cup data:", error);
  }
}
