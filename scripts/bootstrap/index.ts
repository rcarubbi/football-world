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
import { fetchTransfers } from "./fetch-transfers";
import { fetchLineups } from "./fetch-lineups";
import { enrichPlayers } from "./enrich-players";
import { supplementPlayers } from "./supplement-players";
import { fetchWorldCup } from "./fetch-world-cup";
import { fetchWorldCupTeams } from "./fetch-world-cup-teams";
import { fetchSquadsSportsAPIPro } from "./fetch-squads-sportsapipro";
import { validate } from "../validate";

interface BootstrapProgress {
  teams: boolean;
  standings: boolean;
  fixtures: boolean;
  wikipedia: boolean;
  videos: boolean;
  squads: boolean;
  teamDetails: boolean;
  squadsSportsDB: boolean;
  transfers: boolean;
  lineups: boolean;
  playerEnrichment: boolean;
  playerSupplement: boolean;
  worldCup: boolean;
  worldCupTeams: boolean;
  squadsSportsAPIPro: boolean;
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
    transfers: false,
    lineups: false,
    playerEnrichment: false,
    playerSupplement: false,
    worldCup: false,
    worldCupTeams: false,
    squadsSportsAPIPro: false,
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
    // Check if all teams have players before marking complete
    const client = (await import("../../src/lib/turso/client")).getTursoClient();
    const withoutPlayers = await client.execute(
      `SELECT COUNT(*) as n FROM teams t WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.team_id = t.id)`
    );
    if ((withoutPlayers.rows[0].n as number) === 0) {
      progress.squadsSportsDB = true;
      await saveProgress(progress);
      console.log("✓ All teams have squads\n");
    } else {
      console.log(`⚠ ${withoutPlayers.rows[0].n} teams still missing squads (rate limited)\n`);
    }
  }

  if (!progress.squadsSportsAPIPro) {
    console.log("Phase 15: Fetching player squads from SportsAPIPro...");
    try {
      await fetchSquadsSportsAPIPro();
    } catch (error) {
      console.error("Error fetching squads from SportsAPIPro:", (error as Error).message);
    }
    progress.squadsSportsAPIPro = true;
    await saveProgress(progress);
    console.log("✓ SportsAPIPro squads fetched\n");
  }

  if (!progress.transfers) {
    console.log("Phase 9: Fetching transfers...");
    try {
      await fetchTransfers();
    } catch (error) {
      console.error("Error fetching transfers:", (error as Error).message);
    }
    progress.transfers = true;
    await saveProgress(progress);
    console.log("✓ Transfers fetched\n");
  }

  if (!progress.lineups) {
    console.log("Phase 10: Fetching match lineups...");
    try {
      await fetchLineups();
    } catch (error) {
      console.error("Error fetching lineups:", (error as Error).message);
    }
    progress.lineups = true;
    await saveProgress(progress);
    console.log("✓ Lineups fetched\n");
  }

  if (!progress.playerEnrichment) {
    console.log("Phase 11: Enriching players with Wikipedia data...");
    try {
      await enrichPlayers();
    } catch (error) {
      console.error("Error enriching players:", (error as Error).message);
    }
    progress.playerEnrichment = true;
    await saveProgress(progress);
    console.log("✓ Players enriched\n");
  }

  if (!progress.playerSupplement) {
    console.log("Phase 12: Supplementing player data from API-Football...");
    try {
      await supplementPlayers();
    } catch (error) {
      console.error("Error supplementing players:", (error as Error).message);
    }
    progress.playerSupplement = true;
    await saveProgress(progress);
    console.log("✓ Players supplemented\n");
  }

  if (!progress.worldCup) {
    console.log("Phase 13: Fetching World Cup matches...");
    try {
      await fetchWorldCup();
    } catch (error) {
      console.error("Error fetching World Cup:", (error as Error).message);
    }
    progress.worldCup = true;
    await saveProgress(progress);
    console.log("✓ World Cup matches fetched\n");
  }

  if (!progress.worldCupTeams) {
    console.log("Phase 14: Fetching World Cup teams...");
    try {
      await fetchWorldCupTeams();
    } catch (error) {
      console.error("Error fetching World Cup teams:", (error as Error).message);
    }
    progress.worldCupTeams = true;
    await saveProgress(progress);
    console.log("✓ World Cup teams fetched\n");
  }

  console.log("Running data validation...");
  await validate();

  console.log("Bootstrap complete!");
}

main().catch(console.error);
