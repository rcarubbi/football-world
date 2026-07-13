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
  getSquad,
  getTeamsByLeague,
} from "../../../../lib/api/api-football";
import {
  getStandings as getStandingsBBS,
  getTopScorers as getTopScorersBBS,
  getBBSLeagueId,
} from "../../../../lib/api/bigballs";
import { searchVideos, parseDuration } from "../../../../lib/api/youtube";
import { searchTeams, lookupAllPlayers } from "../../../../lib/api/sportsdb";
import { upsertStanding } from "../../../../lib/db/standings";
import { upsertMatch, findMatchByApifootballId } from "../../../../lib/db/matches";
import { upsertTopScorer } from "../../../../lib/db/top-scorers";
import { upsertTransfer } from "../../../../lib/db/transfers";
import { upsertLineup } from "../../../../lib/db/lineups";
import { upsertVideo } from "../../../../lib/db/videos";
import { upsertTeam, countTeamsByLeague, findTeamsWithoutPlayers, updateTeamApifootballId, updateTeamFromSportsDB, updateTeamSportsdbId, findTeamIdByName, normalizeTeamName, findTeamsWithoutVideos } from "../../../../lib/db/teams";
import { upsertPlayerFromApiFootball, upsertPlayerFromSportsDB, findPlayersWithoutPhotosWithTeam, updatePlayerPhoto, findPlayersWithoutPhotosNoTeam } from "../../../../lib/db/players";
import { enrichPlayers } from "../../../../../scripts/bootstrap/enrich-players";
import { fetchWorldCup } from "../../../../../scripts/bootstrap/fetch-world-cup";
import { fetchWorldCupTeams } from "../../../../../scripts/bootstrap/fetch-world-cup-teams";
import { slugify } from "../../../../lib/slugify";

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

interface SportsDBTeam {
  idTeam: string;
  strTeam: string;
  strBadge: string;
  strLogo: string;
  strStadium: string;
  strLocation: string;
  intFormedYear: string;
  strDescriptionEN: string;
}

interface SportsDBPlayer {
  idPlayer: string;
  idTeam: string;
  strPlayer: string;
  strNationality: string;
  strPosition: string;
  dateBorn: string;
  strHeight: string;
  strWeight: string;
  strThumb: string;
  strCutout: string;
  strRender: string;
  strDescriptionEN: string;
  strStatus: string;
}

const F1_KEYWORDS = /\b(f1|formula\s*1|formula\s*one|grand\s*prix|fp[123]|qualifying|lap|grid|pole\s*position|race\s*result|driver|car\s*reveal|oracle\s*red\s*bull|racing\s*point)\b/i;

function isVideoAboutTeam(title: string, teamName: string): boolean {
  if (F1_KEYWORDS.test(title)) return false;
  const normalised = title.toLowerCase();
  const words = teamName
    .toLowerCase()
    .replace(/fc$|cf$|ac$|sc$|bk$/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return words.some((w) => normalised.includes(w));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    teamsAdded: 0,
    teamDetailsEnriched: 0,
    squadsFetched: 0,
    playerPhotosEnriched: 0,
    playerBiosEnriched: 0,
    teamVideosFetched: 0,
    standings: 0,
    fixtures: 0,
    topScorers: 0,
    transfers: 0,
    lineups: 0,
    leagueVideos: 0,
    standingsSource: "none",
    topScorersSource: "none",
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const season = currentMonth >= 8 ? currentYear : currentYear - 1;

  // ─── PHASE 1: Leagues with missing teams ───────────────────────
  console.log("PHASE 1: Checking for leagues with missing teams...");

  for (const league of LEAGUES) {
    if (league.slug === "fifa-world-cup") continue;

    const teamCount = await countTeamsByLeague(league.slug);

    if (teamCount > 0) continue;

    console.log(`  Fetching teams for ${league.name}...`);
    try {
      const standings = (await getStandingsFD(
        league.footballDataCode,
        season
      )) as FootballDataStanding[];
      const regularSeason =
        standings.find((s) => s.stage === "REGULAR_SEASON") || standings[0];
      if (!regularSeason) continue;

      for (const entry of regularSeason.table) {
        await upsertTeam({
          football_data_id: entry.team.id.toString(),
          name: entry.team.name,
          slug: slugify(entry.team.name),
          short_name: entry.team.name.split(" ").pop() || entry.team.name,
          badge_url: entry.team.crest,
          league_slug: league.slug,
        });
        results.teamsAdded++;
      }
      console.log(`    Added ${regularSeason.table.length} teams for ${league.name}`);
    } catch (error) {
      console.error(`  Error fetching teams for ${league.name}:`, error);
    }
  }

  // Also ensure World Cup teams exist
  try {
    await fetchWorldCupTeams();
  } catch (error) {
    console.error("Error fetching World Cup teams:", error);
  }

  // ─── PHASE 2: Teams with missing player squads ────────────────
  console.log("PHASE 2: Fetching squads for teams without players...");

  const teamsWithoutPlayersRows = await findTeamsWithoutPlayers();

  console.log(`  Found ${teamsWithoutPlayersRows.length} teams without players`);

  for (const team of teamsWithoutPlayersRows) {
    const teamId = team.id as number;
    const teamName = team.name as string;
    const leagueSlug = team.league_slug as string;

    // Strategy 1: Try API-Football if team has apifootball_id or we can find one
    try {
      let apiTeamId = team.apifootball_id ? parseInt(team.apifootball_id as string) : null;

      if (!apiTeamId) {
        const leagueConfig = LEAGUES.find((l) => l.slug === leagueSlug);
        if (leagueConfig && leagueConfig.apiFootballId !== 1) {
          const apiTeams = await getTeamsByLeague(leagueConfig.apiFootballId, season);
          const match = apiTeams.find(
            (t: { team: { name: string } }) =>
              t.team.name.toLowerCase() === teamName.toLowerCase() ||
              t.team.name.toLowerCase().includes(teamName.toLowerCase().split(" ")[0])
          );
          if (match) {
            apiTeamId = match.team.id;
            await updateTeamApifootballId(teamId, apiTeamId.toString());
          }
        }
      }

      if (apiTeamId) {
        const players = await getSquad(apiTeamId);
        for (const p of players) {
          const nationality = Array.isArray(p.nationality)
            ? p.nationality.join(", ")
            : (p.nationality as unknown as string) || null;

          await upsertPlayerFromApiFootball({
            apifootball_id: p.id.toString(),
            name: p.name,
            slug: slugify(p.name),
            team_id: teamId,
            position: p.position || null,
            nationality,
            height: p.height || null,
            weight: p.weight || null,
            photo_url: p.photo || null,
          });
        }
        if (players.length > 0) {
          results.squadsFetched += players.length;
          console.log(`    API-Football: ${teamName} → ${players.length} players`);
          await sleep(600);
          continue;
        }
      }
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === "RATE_LIMITED") break;
    }

    // Strategy 2: Try TheSportsDB
    try {
      let tsdbId = team.thesportsdb_id as string | null;

      if (!tsdbId) {
        const results2 = (await searchTeams(teamName)) as SportsDBTeam[];
        if (results2.length > 0) {
          const match =
            results2.find(
              (r) =>
                r.strTeam.toLowerCase().includes(teamName.toLowerCase().split(" ")[0]) ||
                teamName.toLowerCase().includes(r.strTeam.toLowerCase().split(" ")[0])
            ) || results2[0];
          tsdbId = match.idTeam;

          // Also enrich team details while we have them
          await updateTeamFromSportsDB(teamId, {
            thesportsdb_id: match.idTeam || null,
            badge_url: match.strBadge || null,
            stadium: match.strStadium || null,
            location: match.strLocation || null,
            founded: match.intFormedYear || null,
            wikipedia_content: match.strDescriptionEN || null,
          });
          results.teamDetailsEnriched++;
        }
      }

      if (tsdbId) {
        await updateTeamSportsdbId(teamId, tsdbId);

        const players = (await lookupAllPlayers(tsdbId)) as SportsDBPlayer[];
        const activePlayers = players.filter(
          (p) => p.strStatus === "Active" && p.strPlayer && p.strPlayer.trim() !== ""
        );

        for (const p of activePlayers) {
          const photo = p.strCutout || p.strThumb || p.strRender || null;
          await upsertPlayerFromSportsDB({
            thesportsdb_id: p.idPlayer,
            name: p.strPlayer,
            slug: slugify(p.strPlayer),
            team_id: teamId,
            position: p.strPosition || null,
            nationality: p.strNationality || null,
            date_of_birth: p.dateBorn || null,
            height: p.strHeight || null,
            weight: p.strWeight || null,
            photo_url: photo,
            description: p.strDescriptionEN || null,
          });
        }
        if (activePlayers.length > 0) {
          results.squadsFetched += activePlayers.length;
          console.log(`    TheSportsDB: ${teamName} → ${activePlayers.length} players`);
        }
      }
    } catch (error) {
      const msg = (error as Error).message;
      if (msg === "RATE_LIMITED") {
        console.log("  TheSportsDB rate limited, skipping remaining squads");
        break;
      }
      console.error(`    TheSportsDB error for ${teamName}:`, msg);
    }

    await sleep(2000);
  }

  // ─── PHASE 3: Players missing photos ──────────────────────────
  console.log("PHASE 3: Enriching players without photos...");

  const playersWithoutPhotosRows = await findPlayersWithoutPhotosWithTeam(50);

  console.log(`  Found ${playersWithoutPhotosRows.length} players without photos (with TSDB teams)`);

  for (const player of playersWithoutPhotosRows) {
    try {
      const playerId = player.id;
      const playerName = player.name;
      const teamTsdbId = player.team_tsdb_id;

      if (!teamTsdbId) continue;
      const players = (await lookupAllPlayers(teamTsdbId)) as SportsDBPlayer[];
      const match = players.find(
        (p) =>
          p.strPlayer.toLowerCase() === playerName.toLowerCase() ||
          p.strPlayer.toLowerCase().includes(playerName.toLowerCase().split(" ").pop() || "")
      );

      if (match) {
        const photo = match.strCutout || match.strThumb || match.strRender || null;
        if (photo) {
          await updatePlayerPhoto(playerId, {
            photo_url: photo,
            thesportsdb_id: match.idPlayer || null,
            description: match.strDescriptionEN || null,
          });
          results.playerPhotosEnriched++;
        }
      }
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") break;
    }
    await sleep(1500);
  }

  // Also try direct player lookup for those without TSDB team link
  const playersWithoutPhotosNoTeamRows = await findPlayersWithoutPhotosNoTeam(20);

  for (const player of playersWithoutPhotosNoTeamRows) {
    try {
      const searchResults = (await searchTeams(player.name as string)) as SportsDBTeam[];
      if (searchResults.length === 0) continue;

      const tsdbId = searchResults[0].idTeam;
      const players = (await lookupAllPlayers(tsdbId)) as SportsDBPlayer[];
      const match = players.find(
        (p) =>
          p.strPlayer.toLowerCase() === (player.name as string).toLowerCase()
      );

      if (match) {
        const photo = match.strCutout || match.strThumb || match.strRender || null;
        await updatePlayerPhoto(player.id, {
          photo_url: photo,
          thesportsdb_id: match.idPlayer || null,
          description: match.strDescriptionEN || null,
        });
        if (photo) results.playerPhotosEnriched++;
      }
    } catch (error) {
      if ((error as Error).message === "RATE_LIMITED") break;
    }
    await sleep(1500);
  }

  // ─── PHASE 4: Players missing bio/career summary ──────────────
  console.log("PHASE 4: Enriching players with Wikipedia bios...");
  try {
    await enrichPlayers();
  } catch (error) {
    console.error("Error enriching players:", error);
  }

  // ─── PHASE 5: Teams missing videos ────────────────────────────
  console.log("PHASE 5: Fetching videos for teams without highlights...");

  const currentSeasonStr = `${currentYear - 1}-${currentYear}`;

  const teamsWithoutVideosRows = await findTeamsWithoutVideos(50);

  console.log(`  Found ${teamsWithoutVideosRows.length} teams without videos`);

  for (const team of teamsWithoutVideosRows) {
    const teamId = team.id as number;
    const teamName = team.name as string;
    const leagueSlug = team.league_slug as string;

    try {
      const query = `${teamName} football highlights ${currentYear} -formula1 -"formula 1" -F1`;
      const videos = await searchVideos(query, 10);

      for (const video of videos) {
        const durationSeconds = parseDuration(video.duration);

        if (
          durationSeconds >= 120 &&
          durationSeconds <= 900 &&
          isVideoAboutTeam(video.title, teamName)
        ) {
          await upsertVideo({
            video_id: video.videoId,
            title: video.title,
            thumbnail_url: video.thumbnailUrl,
            channel_name: video.channelName,
            duration: durationSeconds,
            entity_type: "team",
            entity_id: teamId,
            league_slug: leagueSlug,
            season: currentSeasonStr,
            published_at: video.publishedAt,
          });
          results.teamVideosFetched++;
        }
      }
    } catch (error) {
      console.error(`  Error fetching videos for ${teamName}:`, error);
    }
    await sleep(500);
  }

  // ─── PHASE 6: Update existing records (standings, etc.) ───────
  console.log("PHASE 6: Updating existing records...");

  // Refresh standings — Big Balls primary, football-data.org fallback
  for (const league of LEAGUES) {
    try {
      const bbsId = getBBSLeagueId(league.slug);

      if (bbsId) {
        try {
          const rows = await getStandingsBBS(bbsId);
          for (const entry of rows) {
            const team = await findTeamIdByName(entry.team_name);
            await upsertStanding({
              league_slug: league.slug,
              season: season.toString(),
              position: entry.position,
              team_id: team?.id ?? null,
              team_name: team?.name ?? normalizeTeamName(entry.team_name),
              team_badge: team?.badge_url ?? null,
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

      const standings = (await getStandingsFD(
        league.footballDataCode,
        season
      )) as FootballDataStanding[];
      const regularSeason =
        standings.find((s) => s.stage === "REGULAR_SEASON") || standings[0];
      if (!regularSeason) continue;

      for (const entry of regularSeason.table) {
        const team = await findTeamIdByName(entry.team.name);
        await upsertStanding({
          league_slug: league.slug,
          season: season.toString(),
          position: entry.position,
          team_id: team?.id ?? null,
          team_name: team?.name ?? entry.team.name,
          team_badge: entry.team.crest ?? team?.badge_url ?? null,
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

  // Refresh fixtures (football-data.org)
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
          const scorers = await getTopScorersBBS(bbsId, season, 10);
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

      const scorers = (await getTopScorersAF(
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
      results.topScorersSource = "apifootball";
    } catch (error) {
      console.error(`Error refreshing top scorers for ${league.name}:`, error);
    }
  }

  // Refresh transfers (API-Football)
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

      for (const fixture of finishedFixtures.slice(0, 5)) {
        const matchResult = await findMatchByApifootballId(fixture.fixture.id.toString());

        if (!matchResult) continue;
        const matchId = matchResult.id;

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

  // Refresh league-level videos (YouTube)
  for (const league of LEAGUES) {
    try {
      const query = `${league.name} football highlights ${season}`;
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
          results.leagueVideos++;
        }
      }
    } catch (error) {
      console.error(`Error refreshing videos for ${league.name}:`, error);
    }
  }

  // Refresh World Cup data
  try {
    await fetchWorldCup();
  } catch (error) {
    console.error("Error refreshing World Cup:", error);
  }

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
