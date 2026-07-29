import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { toStr } from "./normalization";

const log = (msg: string) => console.log(`[former-teams] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const playerRes = await client.execute("SELECT id, external_id FROM players WHERE external_id IS NOT NULL");
  const playerByExtId = new Map<string, number>();
  for (const row of playerRes.rows) {
    playerByExtId.set(row.external_id as string, row.id as number);
  }

  const tsdbRes = await client.execute("SELECT raw_json FROM tsdb_former_teams");
  let inserted = 0;

  for (const row of tsdbRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    // Data is flat: each row is one former team
    const playerId = playerByExtId.get(toStr(raw.idPlayer) || "") || null;
    const playerName = toStr(raw.strPlayer) || null;
    const teamName = toStr(raw.strFormerTeam) || toStr(raw.strTeam) || null;

    if (!playerId && !playerName) continue;

    await client.execute({
      sql: `INSERT INTO player_former_teams (player_id, thesportsdb_id, player_name, team_name, joined, departed, source)
            VALUES (?, ?, ?, ?, ?, ?, 'thesportsdb')
            ON CONFLICT(player_name, team_name, source) DO UPDATE SET
              player_id=COALESCE(excluded.player_id, player_former_teams.player_id),
              joined=COALESCE(excluded.joined, player_former_teams.joined),
              departed=COALESCE(excluded.departed, player_former_teams.departed)`,
      args: [
        playerId, toStr(raw.idPlayer), playerName, teamName,
        toStr(raw.strJoined), toStr(raw.strDeparted) || toStr(raw.strLeft),
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} former-teams upserted`);
  return inserted;
}
