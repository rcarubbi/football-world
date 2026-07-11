import { getStandings } from "../../src/lib/api/football-data";
import { LEAGUES } from "../../src/lib/leagues";
import { upsertStanding } from "../../src/lib/db/standings";

interface FootballDataStanding {
  stage: string;
  table: Array<{
    position: number;
    team: {
      id: number;
      name: string;
      crest: string;
    };
    playedGames: number;
    won: number;
    draw: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    form: string | null;
  }>;
}

export async function fetchStandings(): Promise<void> {
  for (const league of LEAGUES) {
    console.log(`  Fetching standings for ${league.name}...`);

    try {
      const standings = (await getStandings(
        league.footballDataCode,
        2025
      )) as FootballDataStanding[];

      const regularSeason = standings.find((s) => s.stage === "REGULAR_SEASON") || standings[0];
      if (!regularSeason) {
        console.log(`  No standings data for ${league.name}`);
        continue;
      }

      for (const entry of regularSeason.table) {
        await upsertStanding({
          league_slug: league.slug,
          season: "2025",
          position: entry.position,
          team_name: entry.team.name,
          team_badge: entry.team.crest,
          played: entry.playedGames,
          won: entry.won,
          drawn: entry.draw,
          lost: entry.lost,
          goals_for: entry.goalsFor,
          goals_against: entry.goalsAgainst,
          goal_difference: entry.goalDifference,
          points: entry.points,
          form: entry.form,
        });
      }

      console.log(`  Found ${regularSeason.table.length} teams`);
    } catch (error) {
      console.error(`  Error fetching standings for ${league.name}:`, error);
    }
  }
}
