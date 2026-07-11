import { NextRequest, NextResponse } from "next/server";
import { LEAGUES } from "../../../../lib/leagues";
import {
  getStandings as getStandingsFD,
  getMatches,
} from "../../../../lib/api/football-data";
import {
  getTopScorers as getTopScorersAF,
  getTransfers,
  getFixtures,
} from "../../../../lib/api/api-football";
import {
  getStandings as getStandingsBBS,
  getTopScorers as getTopScorersBBS,
  getBBSLeagueId,
} from "../../../../lib/api/bigballs";
import { searchVideos, parseDuration } from "../../../../lib/api/youtube";
import { upsertStanding } from "../../../../lib/db/standings";
import { upsertMatch } from "../../../../lib/db/matches";
import { upsertTopScorer } from "../../../../lib/db/top-scorers";
import { upsertTransfer } from "../../../../lib/db/transfers";
import { upsertLineup } from "../../../../lib/db/lineups";
import { upsertVideo } from "../../../../lib/db/videos";
import { enrichPlayers } from "../../../../../scripts/bootstrap/enrich-players";
import { fetchWorldCup } from "../../../../../scripts/bootstrap/fetch-world-cup";
import { fetchWorldCupTeams } from "../../../../../scripts/bootstrap/fetch-world-cup-teams";
import { slugify } from "../../../../lib/slugify";
import { getTursoClient } from "../../../../lib/turso/client";

interface FootballDataStanding {
  stage: string;
  table: Array<{
    position: number;
    team: { id: number; name: string; crest: string };
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
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: { fullTime: { home: number | null; away: number | null } };
  venue: string | null;
}

interface ApiFootballScorer {
  player: { id: number; name: string; slug: string };
  statistics: Array<{
    goals: { total: number };
    assists: { total: number };
    penalty: { scored: number };
  }>;
}

interface ApiFootballTransfer {
  player: { name: string };
  transfer: { date: string; type: string; description: string };
  teams: { in: { name: string }; out: { name: string } };
}

interface ApiFootballFixture {
  fixture: {
    id: number;
    status: { short: string };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  lineups: Array<{
    team: { id: number; name: string };
    formation: string;
    startXI: Array<{
      player: { id: number; name: string; number: number; pos: string };
    }>;
    substitutes: Array<{
      player: { id: number; name: string; number: number; pos: string };
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    standings: 0,
    fixtures: 0,
    topScorers: 0,
    transfers: 0,
    lineups: 0,
    videos: 0,
    standingsSource: "none",
    topScorersSource: "none",
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const season = currentMonth >= 7 ? currentYear : currentYear - 1;

  // Refresh standings — Big Balls primary, football-data.org fallback
  for (const league of LEAGUES) {
    try {
      const bbsId = getBBSLeagueId(league.slug);

      if (bbsId) {
        try {
          const rows = await getStandingsBBS(bbsId);
          for (const entry of rows) {
            await upsertStanding({
              league_slug: league.slug,
              season: season.toString(),
              position: entry.position,
              team_name: entry.team_name,
              played: entry.played,
              won: entry.won,
              drawn: entry.drawn,
              lost: entry.lost,
              goals_for: entry.goals_for,
              goals_against: entry.goals_against,
              goal_difference: entry.goal_difference,
              points: entry.points,
            });
            results.standings++;
          }
          results.standingsSource = "bigballs";
          continue;
        } catch (e) {
          console.error(`Big Balls standings failed for ${league.name}, falling back:`, (e as Error).message);
        }
      }

      // Fallback: football-data.org
      const standings = (await getStandingsFD(
        league.footballDataCode,
        season
      )) as FootballDataStanding[];
      const regularSeason =
        standings.find((s) => s.stage === "REGULAR_SEASON") || standings[0];
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
      results.standingsSource = "football-data";
    } catch (error) {
      console.error(`Error refreshing standings for ${league.name}:`, error);
    }
  }

  // Refresh fixtures (football-data.org — Big Balls scores lack team names)
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

  // Refresh top scorers — Big Balls primary, API-Football fallback
  for (const league of LEAGUES) {
    try {
      const bbsId = getBBSLeagueId(league.slug);

      if (bbsId) {
        try {
          const scorers = await getTopScorersBBS(bbsId, 2025, 10);
          for (const scorer of scorers) {
            await upsertTopScorer({
              league_slug: league.slug,
              season: season.toString(),
              player_name: scorer.player_name,
              player_slug: slugify(scorer.player_name),
              team_name: scorer.team,
              goals: scorer.goals,
              assists: scorer.assists,
              penalties: 0,
            });
            results.topScorers++;
          }
          results.topScorersSource = "bigballs";
          continue;
        } catch (e) {
          console.error(`Big Balls top scorers failed for ${league.name}, falling back:`, (e as Error).message);
        }
      }

      // Fallback: API-Football (season 2024 for free tier)
      const apiFootballSeason = 2024;
      const scorers = (await getTopScorersAF(
        league.apiFootballId,
        apiFootballSeason
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
      results.topScorersSource = "apifootball";
    } catch (error) {
      console.error(`Error refreshing top scorers for ${league.name}:`, error);
    }
  }

  // Refresh transfers (API-Football)
  const apiFootballSeason = 2024;
  for (const league of LEAGUES) {
    try {
      const transfers = (await getTransfers(
        league.apiFootballId,
        apiFootballSeason
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

  // Refresh lineups (API-Football)
  for (const league of LEAGUES) {
    try {
      const fixtures = (await getFixtures(
        league.apiFootballId,
        season
      )) as ApiFootballFixture[];

      const finishedFixtures = fixtures.filter(
        (f) => f.fixture.status.short === "FT"
      );

      const client = getTursoClient();
      for (const fixture of finishedFixtures.slice(0, 5)) {
        const matchResult = await client.execute({
          sql: "SELECT id FROM matches WHERE apifootball_id = ?",
          args: [fixture.fixture.id.toString()],
        });

        if (matchResult.rows.length === 0) continue;
        const matchId = matchResult.rows[0].id as number;

        for (const lineup of fixture.lineups) {
          for (const player of lineup.startXI) {
            await upsertLineup({
              match_id: matchId,
              team_name: lineup.team.name,
              player_name: player.player.name,
              player_number: player.player.number,
              position: player.player.pos,
              starter: 1,
            });
            results.lineups++;
          }

          for (const sub of lineup.substitutes) {
            await upsertLineup({
              match_id: matchId,
              team_name: lineup.team.name,
              player_name: sub.player.name,
              player_number: sub.player.number,
              position: sub.player.pos,
              starter: 0,
            });
            results.lineups++;
          }
        }
      }
    } catch (error) {
      console.error(`Error refreshing lineups for ${league.name}:`, error);
    }
  }

  // Enrich players with Wikipedia data (top 20 new players)
  try {
    await enrichPlayers();
  } catch (error) {
    console.error("Error enriching players:", error);
  }

  // Refresh videos (YouTube)
  for (const league of LEAGUES) {
    try {
      const query = `${league.name} highlights ${season}`;
      const videos = await searchVideos(query, 5);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        if (durationSeconds >= 120 && durationSeconds <= 900) {
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

  // Refresh World Cup data
  try {
    await fetchWorldCup();
    await fetchWorldCupTeams();
  } catch (error) {
    console.error("Error refreshing World Cup:", error);
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
