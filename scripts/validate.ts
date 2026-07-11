import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
config({ path: resolve(__dirname, "../.env.local") });

import { getTursoClient } from "../src/lib/turso/client";

interface ValidationResult {
  table: string;
  status: "ok" | "warning" | "error";
  message: string;
}

async function validateTable(
  client: ReturnType<typeof getTursoClient>,
  table: string,
  minCount: number
): Promise<ValidationResult> {
  try {
    const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
    const count = result.rows[0].count as number;

    if (count === 0) {
      return { table, status: "error", message: "No data found" };
    }
    if (count < minCount) {
      return { table, status: "warning", message: `Only ${count} rows (expected ${minCount}+)` };
    }
    return { table, status: "ok", message: `${count} rows` };
  } catch {
    return { table, status: "error", message: "Table does not exist" };
  }
}

async function validateNulls(
  client: ReturnType<typeof getTursoClient>,
  table: string,
  column: string
): Promise<ValidationResult> {
  try {
    const result = await client.execute(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${column} IS NULL`
    );
    const nullCount = result.rows[0].count as number;

    const totalResult = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
    const total = totalResult.rows[0].count as number;

    if (total === 0) {
      return { table, status: "error", message: "No data found" };
    }

    const nullPercent = (nullCount / total) * 100;
    if (nullPercent > 50) {
      return { table, status: "warning", message: `${nullPercent.toFixed(0)}% null in ${column}` };
    }
    return { table, status: "ok", message: `${nullCount}/${total} null in ${column}` };
  } catch {
    return { table, status: "error", message: "Table does not exist" };
  }
}

export async function validate(): Promise<ValidationResult[]> {
  const client = getTursoClient();
  const results: ValidationResult[] = [];

  console.log("Running data validation...\n");

  results.push(await validateTable(client, "teams", 20));
  results.push(await validateTable(client, "players", 100));
  results.push(await validateTable(client, "matches", 50));
  results.push(await validateTable(client, "standings", 20));
  results.push(await validateTable(client, "top_scorers", 10));
  results.push(await validateTable(client, "videos", 10));
  results.push(await validateTable(client, "transfers", 10));
  results.push(await validateTable(client, "match_lineups", 50));

  results.push(await validateNulls(client, "players", "career_summary"));
  results.push(await validateNulls(client, "players", "photo_url"));

  const errors = results.filter((r) => r.status === "error").length;
  const warnings = results.filter((r) => r.status === "warning").length;

  for (const result of results) {
    const icon = result.status === "error" ? "✗" : result.status === "warning" ? "⚠" : "✓";
    console.log(`  ${icon} ${result.table}: ${result.message}`);
  }

  console.log(`\nValidation complete: ${errors} errors, ${warnings} warnings`);

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validate().catch(console.error);
}
