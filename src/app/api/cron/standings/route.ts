import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth, getCurrentSeason } from "../auth";
import { getLeaguesFromDb } from "../../../../lib/leagues";
import { getStandings as getStandingsFD } from "../../../../lib/api/football-data";
import { getStandings as getStandingsBBS, getBBSLeagueId } from "../../../../lib/api/bigballs";
import { upsertStanding } from "../../../../lib/db/standings";
import { findTeamIdByName, normalizeTeamName } from "../../../../lib/db/teams";

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

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const season = getCurrentSeason();
  let updated = 0;
  let source = "none";

  const dbLeagues = await getLeaguesFromDb();

  for (const league of dbLeagues) {
    const slug = league.slug;
    const name = league.name;
    const fdCode = league.football_data_code;

    try {
      // 1) Try Football-Data.org first (real data)
      if (fdCode) {
        try {
          const standings = (await getStandingsFD(
            fdCode,
            season
          )) as FootballDataStanding[];
          const regularSeason =
            standings.find((s) => s.stage === "REGULAR_SEASON") || standings[0];
          if (regularSeason) {
            for (const entry of regularSeason.table) {
              const team = await findTeamIdByName(entry.team.name);
              await upsertStanding({
                league_slug: slug,
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
              updated++;
            }
            source = "football-data";
            continue;
          }
        } catch (e) {
          console.error(`Football-Data standings failed for ${name}, falling back:`, (e as Error).message);
        }
      }

      // 2) Fallback: Big Balls Data
      const bbsId = getBBSLeagueId(slug);
      if (bbsId) {
        try {
          const rows = await getStandingsBBS(bbsId);
          if (rows.length > 0 && rows.every(r => (r.games_played ?? 0) === 0)) {
            console.warn(`BBS standings for ${name} are pre-season (all zeros), skipping`);
            continue;
          }
          for (const entry of rows) {
            const team = await findTeamIdByName(entry.team_name);
            const wins = entry.wins;
            const ties = entry.ties;
            const gf = entry.points_for ?? 0;
            const ga = entry.points_against ?? 0;
            await upsertStanding({
              league_slug: slug,
              season: season.toString(),
              position: entry.rank,
              team_id: team?.id ?? null,
              team_name: team?.name ?? normalizeTeamName(entry.team_name),
              team_badge: team?.badge_url ?? entry.logo_url ?? null,
              played: entry.games_played,
              won: wins,
              drawn: ties,
              lost: entry.losses,
              goals_for: gf,
              goals_against: ga,
              goal_difference: gf - ga,
              points: (wins * 3) + ties,
            });
            updated++;
          }
          source = "bigballs";
        } catch (e) {
          console.error(`Big Balls standings failed for ${name}:`, (e as Error).message);
        }
      }
    } catch (error) {
      console.error(`Error refreshing standings for ${name}:`, error);
    }
  }

  return NextResponse.json({
    success: true,
    standingsUpdated: updated,
    source,
    timestamp: new Date().toISOString(),
  });
}
