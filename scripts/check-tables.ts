import { config } from "dotenv";
config({ path: ".env.local" });
import { getTursoClient } from "../src/lib/turso/client";

async function main() {
  const c = getTursoClient();
  const tables = ["teams","players","matches","standings","top_scorers","videos","transfers","match_lineups","world_cups","world_cup_matches","world_cup_teams"];
  for (const t of tables) {
    try {
      const r = await c.execute(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`${t}: ${r.rows[0].count} rows`);
    } catch (e) {
      console.log(`${t}: ERROR - ${(e as Error).message.substring(0, 80)}`);
    }
  }
  // Check career_summary on players
  try {
    const r = await c.execute(`SELECT COUNT(*) as count FROM players WHERE career_summary IS NOT NULL AND career_summary != ''`);
    console.log(`players.career_summary (non-null): ${r.rows[0].count}`);
  } catch (e) {
    console.log(`players.career_summary: ERROR`);
  }
}
main();
