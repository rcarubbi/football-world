import { getTeamsByLeague } from "../../src/lib/api/api-football";
import { LEAGUES } from "../../src/lib/leagues";
import { upsertPlayer } from "../../src/lib/db/players";
import { slugify } from "../../src/lib/slugify";

let apiFootballQuotaUsed = 0;
const API_FOOTBALL_DAILY_LIMIT = 90;

export function getQuotaUsed(): number {
  return apiFootballQuotaUsed;
}

export function isQuotaAvailable(): boolean {
  return apiFootballQuotaUsed < API_FOOTBALL_DAILY_LIMIT;
}

export async function supplementPlayers(): Promise<void> {
  console.log("  Supplementing player data from API-Football...");

  if (!isQuotaAvailable()) {
    console.log("  Skipping: API-Football quota approaching limit");
    return;
  }

  for (const league of LEAGUES) {
    if (!isQuotaAvailable()) {
      console.log("  Stopping: API-Football quota exhausted");
      break;
    }

    console.log(`  Fetching teams for ${league.name}...`);

    try {
      const currentSeason = new Date().getFullYear();
      const teams = (await getTeamsByLeague(
        league.apiFootballId,
        currentSeason
      )) as Array<{
        team: { id: number; name: string; logo: string };
      }>;

      apiFootballQuotaUsed++;

      console.log(`  Found ${teams.length} teams`);
    } catch (error) {
      console.error(`  Error fetching teams for ${league.name}:`, error);
    }
  }

  console.log(`  API-Football quota used: ${apiFootballQuotaUsed}/${API_FOOTBALL_DAILY_LIMIT}`);
}
