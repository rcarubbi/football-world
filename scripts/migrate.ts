import { config } from "dotenv";
config({ path: ".env.local" });
import { getTursoClient } from "../src/lib/turso/client";

async function main() {
  const client = getTursoClient();
  const migrations = [
    "ALTER TABLE players ADD COLUMN career_summary TEXT",
    "ALTER TABLE players ADD COLUMN photo_url TEXT",
    "ALTER TABLE players ADD COLUMN apifootball_id TEXT",
    "ALTER TABLE teams ADD COLUMN thesportsdb_id TEXT",
    "ALTER TABLE teams ADD COLUMN football_data_id TEXT",
    "ALTER TABLE teams ADD COLUMN apifootball_id TEXT",
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`OK: ${sql}`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate column")) {
        console.log(`SKIP (exists): ${sql}`);
      } else {
        console.log(`ERROR: ${sql} — ${msg.substring(0, 80)}`);
      }
    }
  }

  // Verify career_summary exists now
  try {
    const r = await client.execute("SELECT COUNT(*) as count FROM players WHERE career_summary IS NOT NULL");
    console.log(`\nplayers with career_summary: ${r.rows[0].count}`);
  } catch (e) {
    console.log(`\ncareer_summary check failed: ${(e as Error).message.substring(0, 80)}`);
  }
}
main();
