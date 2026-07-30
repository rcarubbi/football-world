import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";

async function main() {
  const client = getTursoClient();
  const start = Date.now();

  const steps = [
    { name: "01-leagues", fn: () => import("./01-leagues").then(m => m.runEtl(client)) },
    { name: "02-venues", fn: () => import("./02-venues").then(m => m.runEtl(client)) },
    { name: "03-teams", fn: () => import("./03-teams").then(m => m.runEtl(client)) },
    { name: "04-players", fn: () => import("./04-players").then(m => m.runEtl(client)) },
    { name: "05-matches", fn: () => import("./05-matches").then(m => m.runEtl(client)) },
    { name: "06-match-events", fn: () => import("./06-match-events").then(m => m.runEtl(client)) },
    { name: "07-standings", fn: () => import("./07-standings").then(m => m.runEtl(client)) },
    { name: "08-scorers", fn: () => import("./08-scorers").then(m => m.runEtl(client)) },
    { name: "09-honours", fn: () => import("./09-honours").then(m => m.runEtl(client)) },
    { name: "10-former-teams", fn: () => import("./10-former-teams").then(m => m.runEtl(client)) },
    { name: "11-videos", fn: () => import("./11-videos").then(m => m.runEtl(client)) },
    { name: "12-transfers", fn: () => import("./12-transfers").then(m => m.runEtl(client)) },
  ];

  console.log("=== ETL Run Starting ===\n");

  for (const step of steps) {
    console.log(`--- ${step.name} ---`);
    try {
      const count = await step.fn();
      console.log(`  → ${count} rows\n`);
    } catch (err) {
      console.error(`  ✗ FAILED: ${(err as Error).message}\n`);
    }
  }

  console.log(`=== ETL Run Complete (${((Date.now() - start) / 1000).toFixed(1)}s) ===`);
}

main().catch(err => {
  console.error("ETL orchestrator failed:", err);
  process.exit(1);
});
