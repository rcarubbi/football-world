import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { normalizeName, normalizeTeamName, toStr } from "./normalization";

const log = (msg: string) => console.log(`[transfers] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  // Build team name → id and league_slug lookup
  const teamRes = await client.execute("SELECT id, name, league_slug FROM teams");
  const teamByName = new Map<string, { id: number; leagueSlug: string | null }>();
  for (const row of teamRes.rows) {
    teamByName.set(normalizeTeamName(row.name as string), {
      id: row.id as number,
      leagueSlug: (row.league_slug as string) || null,
    });
  }

  // Build SAP team_id → league_slug mapping via sap_teams
  const sapTeamsRes = await client.execute("SELECT sap_id, raw_json FROM sap_teams");
  const sapIdToLeagueSlug = new Map<string, string>();
  for (const row of sapTeamsRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const team = raw.team || raw;
    const name = team?.name || team?.shortName;
    if (name) {
      const lookup = teamByName.get(normalizeTeamName(name));
      if (lookup?.leagueSlug) sapIdToLeagueSlug.set(row.sap_id as string, lookup.leagueSlug);
    }
  }
  log(`  SAP teamId→league_slug mapped: ${sapIdToLeagueSlug.size} teams`);

  const sapRes = await client.execute("SELECT sap_team_id, raw_json FROM sap_team_transfers");
  let inserted = 0;

  for (const row of sapRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    if (!raw) continue;

    // Resolve league from the SAP team
    const sapTeamId = row.sap_team_id as string;
    const leagueSlug = sapIdToLeagueSlug.get(sapTeamId) || "unknown";

    for (const dir of ["transfersIn", "transfersOut"]) {
      const list = Array.isArray(raw[dir]) ? raw[dir] : [];
      for (const t of list) {
        const player = t.player || {};
        const playerName = toStr(player.name);
        if (!playerName) continue;

        const playerSlug = normalizeName(playerName).replace(/\s+/g, "-");
        const fromTeam = dir === "transfersIn" ? toStr(t.transferFrom?.name) : null;
        const toTeam = dir === "transfersOut" ? toStr(t.transferTo?.name) : null;
        const transferType = dir === "transfersIn" ? "in" : "out";
        const transferDate = toStr(t.date) || null;

        await client.execute({
          sql: `INSERT INTO transfers (league_slug, player_name, player_slug, from_team, to_team, transfer_type, transfer_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'sportsapipro')`,
          args: [
            leagueSlug, playerName, playerSlug,
            fromTeam, toTeam, transferType, transferDate,
          ],
        });
        inserted++;
      }
    }
  }

  log(`Done: ${inserted} transfers upserted`);
  return inserted;
}
