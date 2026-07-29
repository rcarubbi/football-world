import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../../.env.local") });

import { LEAGUES } from "../../src/lib/leagues";
import { fetchSessionCookie } from "./scrape-helpers";
import { scrapeLeague } from "./scrape-league";
import { getTeamLinks, scrapeTeam, upsertTeamToStaging } from "./scrape-team";
import {
  getPlayerLinks,
  scrapePlayer,
  upsertPlayerToStaging,
} from "./scrape-player";

interface ScrapeResult {
  league: string;
  leagues: { ok: number; fail: number };
  teams: { ok: number; fail: number; total: number };
  players: { ok: number; fail: number; total: number };
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

export async function runScraper(
  leagueFilter?: string
): Promise<ScrapeResult[]> {
  const leagues = leagueFilter
    ? LEAGUES.filter((l) => l.slug === leagueFilter)
    : LEAGUES;

  if (leagues.length === 0) {
    console.error(`No league found for filter: ${leagueFilter}`);
    return [];
  }

  const results: ScrapeResult[] = [];

  await fetchSessionCookie();

  for (const league of leagues) {
    console.error(`\n=== ${league.name} (TSDB: ${league.sportsdbId}) ===`);

    const result: ScrapeResult = {
      league: league.slug,
      leagues: { ok: 0, fail: 0 },
      teams: { ok: 0, fail: 0, total: 0 },
      players: { ok: 0, fail: 0, total: 0 },
    };

    // 1. Scrape league page
    const tsdbLeagueSlug = `${league.sportsdbId}-${league.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    try {
      const lr = await scrapeLeague(tsdbLeagueSlug, league.sportsdbId);
      if (lr.ok) result.leagues.ok++;
      else result.leagues.fail++;
    } catch (e: any) {
      console.error(`  League scrape failed: ${e.message}`);
      result.leagues.fail++;
    }

    // 2. Discover and scrape teams
    console.error(`  Discovering teams...`);
    let teamSlugs: string[];
    try {
      teamSlugs = await getTeamLinks(tsdbLeagueSlug);
    } catch (e: any) {
      console.error(`  Team discovery failed: ${e.message}`);
      results.push(result);
      continue;
    }
    console.error(`  Found ${teamSlugs.length} teams`);
    result.teams.total = teamSlugs.length;

    for (const teamSlug of teamSlugs) {
      try {
        const tr = await scrapeTeam(teamSlug);
        if (tr.ok && tr.data) {
          await upsertTeamToStaging(tr.data);
          result.teams.ok++;
          console.error(`  [${teamSlug}] OK`);

          // 3. Discover and scrape players for this team
          const m = teamSlug.match(/^(\d+)/);
          const teamId = m ? m[1] : "";
          try {
            const playerSlugs = await getPlayerLinks(teamSlug);
            console.error(
              `    Found ${playerSlugs.length} players`
            );
            result.players.total += playerSlugs.length;

            for (const playerSlug of playerSlugs) {
              try {
                const pr = await scrapePlayer(playerSlug, teamId);
                if (pr.ok && pr.data) {
                  await upsertPlayerToStaging(pr.data);
                  result.players.ok++;
                } else {
                  result.players.fail++;
                }
              } catch {
                result.players.fail++;
              }
            }
          } catch (e: any) {
            console.error(`    Player discovery failed: ${e.message}`);
          }
        } else {
          result.teams.fail++;
          console.error(
            `  [${teamSlug}] FAILED: ${tr.error}`
          );
        }
      } catch (e: any) {
        result.teams.fail++;
        console.error(`  [${teamSlug}] ERROR: ${e.message}`);
      }
    }

    console.error(
      `\n  ${league.name}: ${result.leagues.ok} leagues, ${result.teams.ok}/${result.teams.total} teams, ${result.players.ok}/${result.players.total} players`
    );
    results.push(result);
  }

  return results;
}

async function main() {
  const { leagueFilter } = parseArgs();

  console.error("Starting TheSportsDB scraper...\n");
  const results = await runScraper(leagueFilter);

  const totals = results.reduce(
    (acc, r) => ({
      leagues: acc.leagues + r.leagues.ok,
      teams: acc.teams + r.teams.ok,
      players: acc.players + r.players.ok,
    }),
    { leagues: 0, teams: 0, players: 0 }
  );

  console.error(
    `\nDone: ${totals.leagues} leagues, ${totals.teams} teams, ${totals.players} players scraped`
  );

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
