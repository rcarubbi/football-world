import { seedDatabase } from "../../src/lib/turso/seed";
import { findAllTeams } from "../../src/lib/db/teams";
import { scrapeTeamWikipedia } from "./scrape-wikipedia";
import { updateTeamWikipedia } from "../../src/lib/db/teams";

export async function seedTurso(): Promise<void> {
  // Initialize database schema
  await seedDatabase();

  // Process Wikipedia content for teams that don't have it
  const teams = await findAllTeams();

  for (const team of teams) {
    if (!team.wikipedia_content) {
      console.log(`  Scraping Wikipedia for ${team.name}...`);

      const wikiContent = await scrapeTeamWikipedia(team.name, team.slug);
      if (wikiContent) {
        await updateTeamWikipedia(
          team.id,
          wikiContent.wikipedia_content,
          wikiContent.stadium_content
        );
      }
    }
  }

  console.log("  Database seeded with all data");
}
