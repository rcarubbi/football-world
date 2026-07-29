import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../../.env.local") });

import { LEAGUES } from "../../src/lib/leagues";
import { getTournamentSeasons } from "../../src/lib/api/sportsapipro";
import { fetchCountries } from "./fetch-countries";
import { fetchTournaments } from "./fetch-tournaments";
import { fetchStandings } from "./fetch-standings";
import { fetchTopPlayers } from "./fetch-top-players";
import { fetchTeams } from "./fetch-teams";
import { fetchSquads } from "./fetch-squads";
import { fetchTeamTransfers } from "./fetch-team-transfers";
import { fetchMatches } from "./fetch-matches";
import { fetchMatchDetails } from "./fetch-match-detail";
import { fetchMatchLineups } from "./fetch-match-lineups";
import { fetchMatchStatistics } from "./fetch-match-statistics";
import { fetchMatchIncidents } from "./fetch-match-incidents";
import { fetchMatchShotmap } from "./fetch-match-shotmap";
import { fetchPlayers } from "./fetch-players";
import { fetchPlayerStatistics } from "./fetch-player-statistics";

interface LeagueResolution {
  slug: string;
  name: string;
  sapTournamentId: number;
  sapSeasonId: number;
}

function parseArgs(): { leagueFilter?: string; phases: Set<number>; all: boolean; maxPages: number } {
  const args = process.argv.slice(2);
  let leagueFilter: string | undefined;
  const phases = new Set<number>();
  let all = false;
  let maxPages = 10;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--league" && args[i + 1]) {
      leagueFilter = args[i + 1];
      i++;
    } else if (args[i] === "--phase" && args[i + 1]) {
      args[i + 1].split(",").forEach((p) => {
        const n = parseInt(p.trim());
        if (!isNaN(n)) phases.add(n);
      });
      i++;
    } else if (args[i] === "--all") {
      all = true;
    } else if (args[i] === "--max-pages" && args[i + 1]) {
      maxPages = parseInt(args[i + 1]);
      i++;
    }
  }

  if (phases.size === 0 && !all) {
    phases.add(1);
  }

  return { leagueFilter, phases, all, maxPages };
}

function resolveLeagues(filter?: string): string[] {
  const allSlugs = LEAGUES.map((l) => l.slug);
  if (!filter) return allSlugs;
  if (allSlugs.includes(filter)) return [filter];
  console.error(`Unknown league: ${filter}. Valid: ${allSlugs.join(", ")}`);
  process.exit(1);
}

const MANUAL_SAP_MAP: Record<string, number> = {
  "brasileirao-serie-a": 325,
};

async function resolveSAPLeagues(slugs: string[]): Promise<LeagueResolution[]> {
  const resolutions: LeagueResolution[] = [];
  for (const slug of slugs) {
    const league = LEAGUES.find((l) => l.slug === slug);
    if (!league) continue;
    let tournamentId: number | null = MANUAL_SAP_MAP[slug] ?? null;
    if (!tournamentId) {
      console.log(`  Resolving SAP tournament for ${league.name}...`);
      try {
        const { searchAll } = await import("../../src/lib/api/sportsapipro");
        const results = await searchAll(league.name);
        console.log(`  Search results for "${league.name}": ${(results as unknown[]).length} items`);
        const tournament = (results as { type: string; entity: { id: number; name: string } }[])
          .find((r) => r.type === "tournament" || r.type === "uniqueTournament");
        if (!tournament) {
          console.warn(`  Could not find SAP tournament for ${league.name}`);
          console.warn(`  Types found: ${(results as { type: string }[]).map(r => r.type).join(', ')}`);
          continue;
        }
        tournamentId = tournament.entity.id;
      } catch (err) {
        console.error(`  Error resolving ${league.name}: ${err}`);
        continue;
      }
    } else {
      console.log(`  Using manual SAP tournament ID for ${league.name}: ${tournamentId}`);
    }
    try {
      const seasons = await getTournamentSeasons(tournamentId) as { id: number; name: string }[];
      if (!seasons.length) {
        console.warn(`  No seasons for ${league.name}`);
        continue;
      }
      const currentSeason = seasons[0];
      resolutions.push({
        slug,
        name: league.name,
        sapTournamentId: tournamentId,
        sapSeasonId: currentSeason.id,
      });
      console.log(`  ${league.name}: tournament=${tournamentId}, season=${currentSeason.id} (${currentSeason.name})`);
    } catch (err) {
      console.error(`  Error resolving season for ${league.name}: ${err}`);
    }
  }
  return resolutions;
}

export async function runImporter(
  leagueFilter?: string,
  phaseFilter?: Set<number>,
  maxPages = 10
): Promise<{ league: string; status: string }[]> {
  const slugs = resolveLeagues(leagueFilter);
  const phases = phaseFilter || new Set([1]);
  const results: { league: string; status: string }[] = [];

  // Phase 1: Discovery
  if (phases.has(1)) {
    console.log("\n--- Phase 1: Discovery ---");
    await fetchCountries();
    await fetchTournaments(!!leagueFilter);
  }

  // Resolve SAP tournament/season IDs for all leagues
  const sapLeagues = await resolveSAPLeagues(slugs);

  if (phases.has(1)) {
    console.log("\n--- Phase 1: Standings + Top Players ---");
    await fetchStandings(sapLeagues);
    await fetchTopPlayers(sapLeagues);
  }

  // Phase 2: Teams
  if (phases.has(2)) {
    console.log("\n--- Phase 2: Teams + Squads ---");
    await fetchTeams(sapLeagues);
    await fetchSquads(sapLeagues);
    await fetchTeamTransfers(sapLeagues);
  }

  // Phase 3: Matches
  if (phases.has(3)) {
    console.log("\n--- Phase 3: Matches ---");
    await fetchMatches(sapLeagues, maxPages);
    await fetchMatchDetails(sapLeagues);
    await fetchMatchLineups(sapLeagues);
    await fetchMatchStatistics(sapLeagues);
    await fetchMatchIncidents(sapLeagues);
    await fetchMatchShotmap(sapLeagues);
  }

  // Phase 4: Players
  if (phases.has(4)) {
    console.log("\n--- Phase 4: Players ---");
    await fetchPlayers();
    await fetchPlayerStatistics();
  }

  for (const league of sapLeagues) {
    results.push({ league: league.slug, status: "ok" });
  }
  return results;
}

async function main() {
  const { leagueFilter, phases, all, maxPages } = parseArgs();
  const phasesToRun = all ? new Set([1, 2, 3, 4]) : phases;

  console.log("Starting SportsAPI Pro importer...");
  console.log(`Phases: ${[...phasesToRun].join(", ")}`);
  if (leagueFilter) console.log(`League: ${leagueFilter}`);
  console.log(`Max pages: ${maxPages}`);

  const results = await runImporter(leagueFilter, phasesToRun, maxPages);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
