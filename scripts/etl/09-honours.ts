import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { toStr } from "./normalization";

const log = (msg: string) => console.log(`[honours] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const playerRes = await client.execute("SELECT id, external_id FROM players WHERE external_id IS NOT NULL");
  const playerByExtId = new Map<string, number>();
  for (const row of playerRes.rows) {
    playerByExtId.set(row.external_id as string, row.id as number);
  }

  const tsdbRes = await client.execute("SELECT raw_json FROM tsdb_player_honours");
  let inserted = 0;

  for (const row of tsdbRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    // Data is flat: each row is one honour
    const playerId = playerByExtId.get(toStr(raw.idPlayer) || "") || null;
    const playerName = toStr(raw.strPlayer) || null;
    const honours = toStr(raw.strHonour) || null;
    const year = toStr(raw.strSeason);

    if (!playerId && !playerName) continue;

    await client.execute({
      sql: `INSERT INTO player_honours (player_id, thesportsdb_id, player_name, honour_name, year, source)
            VALUES (?, ?, ?, ?, ?, 'thesportsdb')
            ON CONFLICT(player_name, honour_name, year, source) DO UPDATE SET
              player_id=COALESCE(excluded.player_id, player_honours.player_id)`,
      args: [playerId, toStr(raw.idPlayer), playerName, honours, year],
    });
    inserted++;
  }

  log(`Done: ${inserted} honours upserted`);
  return inserted;
}
