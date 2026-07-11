import { getMatches } from "../../src/lib/api/football-data";
import { LEAGUES } from "../../src/lib/leagues";
import { upsertMatch } from "../../src/lib/db/matches";

interface FootballDataMatch {
  id: number;
  matchday: number;
  status: string;
  utcDate: string;
  homeTeam: {
    id: number;
    name: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    crest: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  venue: string | null;
}

export async function fetchFixtures(): Promise<void> {
  for (const league of LEAGUES) {
    console.log(`  Fetching fixtures for ${league.name}...`);

    try {
      const matches = (await getMatches(
        league.footballDataCode
      )) as FootballDataMatch[];

      for (const match of matches) {
        const matchDate = new Date(match.utcDate);
        await upsertMatch({
          football_data_id: match.id.toString(),
          league_slug: league.slug,
          season: new Date().getFullYear().toString(),
          matchday: match.matchday,
          status: match.status,
          home_team_name: match.homeTeam.name,
          home_score: match.score.fullTime.home,
          away_team_name: match.awayTeam.name,
          away_score: match.score.fullTime.away,
          match_date: matchDate.toISOString().split("T")[0],
          match_time: matchDate.toISOString().split("T")[1].substring(0, 5),
          venue: match.venue,
        });
      }
    } catch (error) {
      console.error(`  Error fetching fixtures for ${league.name}:`, error);
    }
  }
}
