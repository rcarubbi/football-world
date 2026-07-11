import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../../.env.local") });
import { LEAGUES } from "../../src/lib/leagues";
import { seedDatabase } from "../../src/lib/turso/seed";
import { fetchTeamsFromFootballData } from "./fetch-teams";
import { fetchStandings } from "./fetch-standings";
import { fetchFixtures } from "./fetch-fixtures";
import { scrapeWikipedia } from "./scrape-wikipedia";
import { fetchVideos } from "./fetch-videos";
import { fetchSquads } from "./fetch-squads";
import { fetchTeamDetails } from "./fetch-team-details";
import { fetchSquadsSportsDB } from "./fetch-squads-sportsdb";

interface BootstrapProgress {
  teams: boolean;
  standings: boolean;
  fixtures: boolean;
  wikipedia: boolean;
  videos: boolean;
  squads: boolean;
  teamDetails: boolean;
  squadsSportsDB: boolean;
}

async function loadProgress(): Promise<BootstrapProgress> {
  try {
    const fs = await import("fs");
    const progressFile = "bootstrap-progress.json";
    if (fs.existsSync(progressFile)) {
      return JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    }
  } catch {}
  return {
    teams: false,
    standings: false,
    fixtures: false,
    wikipedia: false,
    videos: false,
    squads: false,
    teamDetails: false,
    squadsSportsDB: false,
  };
}

async function saveProgress(progress: BootstrapProgress): Promise<void> {
  const fs = await import("fs");
  fs.writeFileSync("bootstrap-progress.json", JSON.stringify(progress, null, 2));
}

async function main() {
  console.log("Starting football wiki bootstrap...\n");

  await seedDatabase();
  console.log("✓ Database initialized\n");

  const progress = await loadProgress();

  if (!progress.teams) {
    console.log("Phase 1: Fetching teams from football-data.org...");
    for (const league of LEAGUES) {
      console.log(`  Fetching ${league.name}...`);
      try {
        await fetchTeamsFromFootballData(league);
      } catch (error) {
        console.error(`  Error fetching teams for ${league.name}:`, (error as Error).message);
      }
    }
    progress.teams = true;
    await saveProgress(progress);
    console.log("✓ Teams fetched\n");
  }

  if (!progress.standings) {
    console.log("Phase 2: Fetching standings...");
    try {
      await fetchStandings();
    } catch (error) {
      console.error("Error fetching standings:", (error as Error).message);
    }
    progress.standings = true;
    await saveProgress(progress);
    console.log("✓ Standings fetched\n");
  }

  if (!progress.fixtures) {
    console.log("Phase 3: Fetching fixtures...");
    try {
      await fetchFixtures();
    } catch (error) {
      console.error("Error fetching fixtures:", (error as Error).message);
    }
    progress.fixtures = true;
    await saveProgress(progress);
    console.log("✓ Fixtures fetched\n");
  }

  if (!progress.wikipedia) {
    console.log("Phase 4: Scraping Wikipedia...");
    await scrapeWikipedia();
    progress.wikipedia = true;
    await saveProgress(progress);
    console.log("✓ Wikipedia scraped\n");
  }

  if (!progress.videos) {
    console.log("Phase 5: Fetching YouTube videos...");
    await fetchVideos();
    progress.videos = true;
    await saveProgress(progress);
    console.log("✓ Videos fetched\n");
  }

  if (!progress.squads) {
    console.log("Phase 6: Fetching player squads (API-Football)...");
    await fetchSquads();
    progress.squads = true;
    await saveProgress(progress);
    console.log("✓ Squads fetched\n");
  }

  if (!progress.teamDetails) {
    console.log("Phase 7: Fetching team details from TheSportsDB...");
    await fetchTeamDetails();
    progress.teamDetails = true;
    await saveProgress(progress);
    console.log("✓ Team details fetched\n");
  }

  if (!progress.squadsSportsDB) {
    console.log("Phase 8: Fetching player squads from TheSportsDB...");
    await fetchSquadsSportsDB();
    progress.squadsSportsDB = true;
    await saveProgress(progress);
    console.log("✓ Squads fetched from TheSportsDB\n");
  }

  console.log("Bootstrap complete!");
}

main().catch(console.error);
