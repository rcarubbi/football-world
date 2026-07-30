import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";

const log = (msg: string) => console.log(`[standings] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  // Standings are written exclusively by the CRON route
  // (src/app/api/cron/standings/route.ts) which fetches from
  // Football-Data.org API with BBS fallback.
  // ETL only stages raw data in sap_standings / bbd_standings.
  // Writing league_standings here would overwrite CRON data
  // with incomplete pre-season placeholders.
  log("Skipping (CRON-only writer)");
  return 0;
}
