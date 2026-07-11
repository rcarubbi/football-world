import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "../../../../lib/leagues";
import { getStandings, getMatches } from "../../../../lib/api/football-data";
import { getTopScorers, getTransfers } from "../../../../lib/api/api-football";
import { searchVideos, parseDuration } from "../../../../lib/api/youtube";
import { upsertStanding } from "../../../../lib/db/standings";
import { upsertMatch } from "../../../../lib/db/matches";
import { upsertTopScorer } from "../../../../lib/db/top-scorers";
import { upsertTransfer } from "../../../../lib/db/transfers";
import { upsertVideo } from "../../../../lib/db/videos";
import { slugify } from "../../../../lib/slugify";

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

interface FootballDataMatch {
  id: number;
  matchday: number;
  status: string;
  utcDate: string;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  venue: string | null;
}

interface ApiFootballScorer {
  player: {
    id: number;
    name: string;
    slug: string;
  };
  statistics: Array<{
    goals: {
      total: number;
    };
    assists: {
      total: number;
    };
    penalty: {
      scored: number;
    };
  }>;
}

interface ApiFootballTransfer {
  player: {
    name: string;
  };
  transfer: {
    date: string;
    type: string;
    description: string;
  };
  teams: {
    in: {
      name: string;
    };
    out: {
      name: string;
    };
  };
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    standings: 0,
    fixtures: 0,
    topScorers: 0,
    transfers: 0,
    videos: 0,
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const season = currentMonth >= 7 ? currentYear : currentYear - 1;

  // Refresh standings
  for (const league of LEAGUES) {
    try {
      const standings = (await getStandings(
        league.footballDataCode,
        season
      )) as FootballDataStanding[];

      const regularSeason = standings.find((s) => s.stage === "REGULAR_SEASON") || standings[0];
      if (!regularSeason) continue;

      for (const entry of regularSeason.table) {
        await upsertStanding({
          league_slug: league.slug,
          season: season.toString(),
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
        results.standings++;
      }
    } catch (error) {
      console.error(`Error refreshing standings for ${league.name}:`, error);
    }
  }

  // Refresh fixtures
  for (const league of LEAGUES) {
    try {
      const matches = (await getMatches(
        league.footballDataCode,
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
        results.fixtures++;
      }
    } catch (error) {
      console.error(`Error refreshing fixtures for ${league.name}:`, error);
    }
  }

  // Refresh top scorers
  for (const league of LEAGUES) {
    try {
      const scorers = (await getTopScorers(
        league.apiFootballId,
        season
      )) as ApiFootballScorer[];

      for (const scorer of scorers.slice(0, 10)) {
        await upsertTopScorer({
          league_slug: league.slug,
          season: season.toString(),
          apifootball_id: scorer.player.id.toString(),
          player_name: scorer.player.name,
          player_slug: slugify(scorer.player.name),
          team_name: "",
          goals: scorer.statistics[0]?.goals.total || 0,
          assists: scorer.statistics[0]?.assists.total || 0,
          penalties: scorer.statistics[0]?.penalty.scored || 0,
        });
        results.topScorers++;
      }
    } catch (error) {
      console.error(`Error refreshing top scorers for ${league.name}:`, error);
    }
  }

  // Refresh transfers
  for (const league of LEAGUES) {
    try {
      const transfers = (await getTransfers(
        league.apiFootballId,
        season
      )) as ApiFootballTransfer[];

      for (const transfer of transfers.slice(0, 20)) {
        await upsertTransfer({
          league_slug: league.slug,
          season: season.toString(),
          player_name: transfer.player.name,
          player_slug: slugify(transfer.player.name),
          from_team: transfer.teams.out.name,
          to_team: transfer.teams.in.name,
          transfer_type: transfer.transfer.type,
          transfer_date: transfer.transfer.date,
          transfer_fee: transfer.transfer.description,
        });
        results.transfers++;
      }
    } catch (error) {
      console.error(`Error refreshing transfers for ${league.name}:`, error);
    }
  }

  // Refresh videos
  for (const league of LEAGUES) {
    try {
      const query = `${league.name} highlights ${season}`;
      const videos = await searchVideos(query, 5);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        if (durationSeconds >= 180 && durationSeconds <= 600) {
          await upsertVideo({
            video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName,
            duration: durationSeconds,
            entity_type: "league",
            league_slug: league.slug,
            season: season.toString(),
            published_at: video.publishedAt,
          });
          results.videos++;
        }
      }
    } catch (error) {
      console.error(`Error refreshing videos for ${league.name}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
