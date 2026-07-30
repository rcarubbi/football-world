import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth, getCurrentSeason } from "../auth";
import { getLeaguesFromDb } from "../../../../lib/leagues";
import { getMatches } from "../../../../lib/api/football-data";
import { upsertMatch } from "../../../../lib/db/matches";

interface FootballDataMatch {
  id: number;
  matchday: number;
  status: string;
  utcDate: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
  venue: string | null;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const season = getCurrentSeason();
  let updated = 0;

  const dbLeagues = await getLeaguesFromDb();
  for (const league of dbLeagues) {
    const fdCode = league.football_data_code;
    if (!fdCode) continue;

    try {
      const matches = (await getMatches(
        fdCode,
        undefined,
        season
      )) as FootballDataMatch[];

      for (const match of matches) {
        const matchDate = new Date(match.utcDate);
        await upsertMatch({
          football_data_id: match.id.toString(),
          league_slug: league.slug,
          season: season.toString(),
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
        updated++;
      }
    } catch (error) {
      console.error(`Error refreshing fixtures for ${league.name}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    fixturesUpdated: updated,
    timestamp: new Date().toISOString(),
  });
}
