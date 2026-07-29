import { getTursoClient } from "../../src/lib/turso/client";
import { getScorers } from "../../src/lib/api/football-data";
import { LeagueConfig, getCurrentSeason } from "../../src/lib/leagues";

interface FdScorer {
  player: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    position: string;
    shirtNumber: number;
  };
  team: { id: number; name: string };
  goals: number;
  assists: number | null;
  penalties: number | null;
}

export async function fetchScorers(league: LeagueConfig): Promise<number> {
  const client = getTursoClient();
  const season = getCurrentSeason();

  try {
    const scorers = (await getScorers(
      league.footballDataCode,
      season,
      100
    )) as FdScorer[];
    let count = 0;

    for (const scorer of scorers) {
      await client.execute({
        sql: `INSERT OR REPLACE INTO fbdo_scorers (fd_id, competition_code, season, player_name, player_id, team_name, goals, assists, penalties, raw_json, fetched_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          scorer.player?.id || 0,
          league.footballDataCode,
          season,
          scorer.player?.name || "",
          scorer.player?.id || null,
          scorer.team?.name || "",
          scorer.goals || 0,
          scorer.assists || null,
          scorer.penalties || null,
          JSON.stringify(scorer),
        ],
      });
      count++;
    }

    console.log(`    ${count} scorers stored`);
    return count;
  } catch (e: any) {
    console.error(`    Error fetching scorers for ${league.name}: ${e.message}`);
    return 0;
  }
}
