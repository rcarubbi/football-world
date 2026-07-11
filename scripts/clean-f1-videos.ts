import { config } from "dotenv";
config({ path: ".env.local" });
import { getTursoClient } from "../src/lib/turso/client";

async function main() {
  const client = getTursoClient();

  // Find videos with F1-related titles
  const f1Pattern = /\b(f1|formula\s*1|formula\s*one|grand\s*prix|fp[123]|pole\s*position|oracle\s*red\s*bull|racing\s*point)\b/i;

  const result = await client.execute("SELECT id, video_id, title, entity_type, entity_id FROM videos");
  const f1Videos = result.rows.filter((row) => f1Pattern.test(row.title as string));

  console.log(`Found ${f1Videos.length} F1-contaminated videos out of ${result.rows.length} total`);

  for (const video of f1Videos) {
    console.log(`  Removing: "${video.title}" (entity: ${video.entity_type} ${video.entity_id})`);
    await client.execute({ sql: "DELETE FROM videos WHERE id = ?", args: [video.id] });
  }

  console.log(`\nCleaned ${f1Videos.length} F1 videos`);
}
main();
