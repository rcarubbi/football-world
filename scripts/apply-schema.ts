import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { getTursoClient } from "../src/lib/turso/client";
import { SCHEMA, INDICES } from "../src/lib/turso/schema";

async function main() {
  const client = getTursoClient();
  const all = SCHEMA + "\n" + INDICES;
  const stmts = all
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of stmts) {
    try {
      await client.execute(stmt + ";");
    } catch (e: any) {
      if (e.message?.includes("already exists")) continue;
      console.error("FAIL:", stmt.slice(0, 80), e.message?.slice(0, 100));
    }
  }
  console.log("Schema applied successfully");
}
main().catch(console.error);
