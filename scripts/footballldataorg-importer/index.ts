import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../../.env.local") });

import { LEAGUES, LeagueConfig, getCurrentSeason } from "../../src/lib/leagues";
import { getTursoClient } from "../../src/lib/turso/client";
import { fetchAreas } from "./fetch-areas";
import { fetchCompetition } from "./fetch-competitions";
import { fetchTeams } from "./fetch-teams";
import { fetchScorers } from "./fetch-scorers";
import { fetchTeamDetail } from "./fetch-team-detail";
import { fetchPersonDetail } from "./fetch-persons";
import { fetchMatchDetail } from "./fetch-match-detail";
import { getMatches } from "../../src/lib/api/football-data";

interface ImportResult {
  league: string;
  areas: number;
  competition: boolean;
  teams: number;
  scorers: number;
  teamDetails: number;
  persons: number;
  matchDetails: number;
}

function parseArgs(): { leagueFilter?: string } {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--league" && args[i + 1]) {
      return { leagueFilter: args[i + 1] };
    }
  }
  return {};
}
async function getAlreadyFetchedIds(
  table: string
): Promise<Set<number>> {
  const client = getTursoClient();
  try {
    const result = await client.execute(`SELECT fd_id FROM ${table}`);
    return new Set(result.rows.map((r) => r.fd_id as number));
  } catch {
    return new Set();
  }
}

async function getMatchIdsForLeague(
  league: LeagueConfig
): Promise<number[]> {
  const season = getCurrentSeason();
  try {
    const matches = (await getMatches(
      league.footballDataCode,
      undefined,
      season
    )) as { id: number }[];

    return matches.map((m) => m.id);
  } catch {
    return [];
  }
}

async function getTeamIdsFromFbdoTeams(
  competitionCode: string
): Promise<number[]> {
  const client = getTursoClient();
  try {
    const result = await client.execute({
      sql: "SELECT fd_id FROM fbdo_teams WHERE competition_code = ?",
      args: [competitionCode],
    });
    return result.rows.map((r) => r.fd_id as number);
  } catch {
    return [];
  }
}

async function getTeamDetailsWithSquads(): Promise<Array<{ fd_id: number; squad_json: string }>> {
  const client = getTursoClient();
  try {
    const result = await client.execute({
      sql: "SELECT fd_id, squad_json FROM fbdo_team_detail WHERE squad_json IS NOT NULL AND squad_json != '[]'",
      args: [],
    });
    return result.rows as unknown as Array<{ fd_id: number; squad_json: string }>;
  } catch {
    return [];
  }
}

export async function runImporter(
  leagueFilter?: string
): Promise<ImportResult[]> {
  const leagues = leagueFilter
    ? LEAGUES.filter((l) => l.slug === leagueFilter)
    : LEAGUES;

  if (leagues.length === 0) {
    console.error(`No league found for filter: ${leagueFilter}`);
    return [];
  }

  const results: ImportResult[] = [];
  const alreadyFetchedTeams = await getAlreadyFetchedIds("fbdo_team_detail");
  const alreadyFetchedPersons = await getAlreadyFetchedIds("fbdo_persons");
  const alreadyFetchedMatches = await getAlreadyFetchedIds("fbdo_match_detail");

  // Phase 1: Areas (once)
  console.log("Phase 1: Fetching areas...");
  let areaCount = 0;
  try {
    areaCount = await fetchAreas();
  } catch (e: any) {
    console.error(`  Error fetching areas: ${e.message}`);
  }

  // Phase 2: Per-league data
  for (const league of leagues) {
    console.log(`\n=== ${league.name} (${league.footballDataCode}) ===`);

    const result: ImportResult = {
      league: league.slug,
      areas: areaCount,
      competition: false,
      teams: 0,
      scorers: 0,
      teamDetails: 0,
      persons: 0,
      matchDetails: 0,
    };

    // 2a. Competition detail
    console.log("  Fetching competition...");
    result.competition = await fetchCompetition(league);

    // 2b. Teams
    console.log("  Fetching teams...");
    result.teams = await fetchTeams(league);

    // 2c. Scorers
    console.log("  Fetching scorers...");
    result.scorers = await fetchScorers(league);

    // 2d. Team details (for teams not yet fetched)
    console.log("  Fetching team details...");
    const teamIds = await getTeamIdsFromFbdoTeams(league.footballDataCode);

    for (const teamId of teamIds) {
      if (alreadyFetchedTeams.has(teamId)) continue;
      const ok = await fetchTeamDetail(teamId, alreadyFetchedTeams);
      if (ok) result.teamDetails++;
    }
    console.log(`    ${result.teamDetails} new team details stored`);

    // 2e. Persons (from team detail squads)
    console.log("  Fetching persons from squads...");
    const teamDetails = await getTeamDetailsWithSquads();

    for (const row of teamDetails) {
      const squad = JSON.parse(row.squad_json as string) as Array<{ id: number }>;
      for (const player of squad) {
        if (!player.id || alreadyFetchedPersons.has(player.id)) continue;
        const ok = await fetchPersonDetail(player.id, alreadyFetchedPersons);
        if (ok) result.persons++;
      }
    }
    console.log(`    ${result.persons} new persons stored`);

    // 2f. Match details
    console.log("  Fetching match details...");
    const matchIds = await getMatchIdsForLeague(league);
    console.log(`    ${matchIds.length} matches to check`);

    for (const matchId of matchIds) {
      if (alreadyFetchedMatches.has(matchId)) continue;
      const ok = await fetchMatchDetail(matchId, alreadyFetchedMatches);
      if (ok) result.matchDetails++;
    }
    console.log(`    ${result.matchDetails} new match details stored`);

    results.push(result);
  }

  return results;
}

async function main() {
  const { leagueFilter } = parseArgs();

  console.log("Starting football-data.org importer...\n");
  const results = await runImporter(leagueFilter);

  const totals = results.reduce(
    (acc, r) => ({
      teams: acc.teams + r.teams,
      teamDetails: acc.teamDetails + r.teamDetails,
      scorers: acc.scorers + r.scorers,
      persons: acc.persons + r.persons,
      matchDetails: acc.matchDetails + r.matchDetails,
    }),
    { teams: 0, teamDetails: 0, scorers: 0, persons: 0, matchDetails: 0 }
  );

  console.log(
    `\nDone: ${totals.teams} teams, ${totals.teamDetails} team details, ${totals.scorers} scorers, ${totals.persons} persons, ${totals.matchDetails} match details`
  );

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
