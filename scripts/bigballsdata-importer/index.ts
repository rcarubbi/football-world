import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../../.env.local") });

import { LEAGUES } from "../../src/lib/leagues";
import { fetchLeagues } from "./fetch-leagues";
import { fetchStandings } from "./fetch-standings";
import { fetchScorers } from "./fetch-scorers";
import { fetchInjuries } from "./fetch-injuries";
import { fetchTeams } from "./fetch-team";
import { fetchMatches } from "./fetch-matches";
import { fetchPlayers } from "./fetch-players";
import { fetchPlayerTransfers } from "./fetch-player-transfers";
import { fetchPlayerTrophies } from "./fetch-player-trophies";

function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? year : year - 1;
}

function parseArgs(): { leagueFilter?: string; phases: Set<number>; all: boolean } {
  const args = process.argv.slice(2);
  let leagueFilter: string | undefined;
  const phases = new Set<number>();
  let all = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--league" && args[i + 1]) {
      leagueFilter = args[i + 1];
      i++;
    } else if (args[i] === "--phase" && args[i + 1]) {
      args[i + 1].split(",").forEach((p) => phases.add(parseInt(p)));
      i++;
    } else if (args[i] === "--all") {
      all = true;
    }
  }

  if (phases.size === 0) {
    phases.add(1);
  }

  return { leagueFilter, phases, all };
}

function resolveLeagues(filter?: string): string[] {
  const allLeagues = LEAGUES.map((l) => l.slug);
  if (!filter) return allLeagues;
  if (allLeagues.includes(filter)) return [filter];
  console.error(`Unknown league: ${filter}. Valid: ${allLeagues.join(", ")}`);
  process.exit(1);
}

export async function runImporter(
  leagueFilter?: string,
  phaseFilter?: Set<number>
): Promise<{ league: string; status: string }[]> {
  const leagues = resolveLeagues(leagueFilter);
  const season = getCurrentSeason();
  const phases = phaseFilter || new Set([1]);
  const results: { league: string; status: string }[] = [];

  for (const league of leagues) {
    const result = { league, status: "ok" };
    try {
      if (phases.has(1)) {
        await fetchLeagues();
        await fetchStandings([league], season);
        await fetchScorers([league]);
        await fetchInjuries();
        await fetchTeams([league], season);
      }
      if (phases.has(2)) {
        await fetchMatches([league], season);
      }
      if (phases.has(3)) {
        await fetchPlayers([league]);
      }
      if (phases.has(4)) {
        await fetchPlayerTransfers();
        await fetchPlayerTrophies();
      }
    } catch (err) {
      result.status = (err as Error).message;
      console.error("STACK:", (err as Error).stack?.substring(0, 500));
    }
    results.push(result);
  }
  return results;
}

async function main() {
  const { leagueFilter, phases, all } = parseArgs();
  const phasesToRun = all ? new Set([1, 2, 3, 4, 5]) : phases;

  console.log("Starting Big Balls Data importer...");
  console.log(`Season: ${getCurrentSeason()}`);
  console.log(`Phases: ${[...phasesToRun].join(", ")}`);
  if (leagueFilter) console.log(`League: ${leagueFilter}`);
  console.log("");

  const results = await runImporter(leagueFilter, phasesToRun);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
