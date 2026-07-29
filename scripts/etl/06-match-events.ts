import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { toStr, normalizeName } from "./normalization";

const log = (msg: string) => console.log(`[match-events] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const teamRes = await client.execute("SELECT id, name FROM teams");
  const teamByName = new Map<string, number>();
  for (const row of teamRes.rows) {
    teamByName.set(normalizeName(row.name as string), row.id as number);
  }

  const matchRes = await client.execute("SELECT id, external_id, home_team_name, away_team_name FROM matches WHERE source='thesportsdb'");
  const matchById = new Map<string, typeof matchRes.rows[0]>();
  for (const row of matchRes.rows) {
    matchById.set(row.external_id as string, row);
  }

  const timelineRes = await client.execute("SELECT raw_json FROM tsdb_timelines");
  let inserted = 0;

  for (const row of timelineRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const eventId = toStr(raw.idEvent);
    if (!eventId) continue;

    const match = matchById.get(eventId);
    if (!match) continue;

    const teamName = toStr(raw.strTeam);
    const teamId = teamName ? teamByName.get(normalizeName(teamName)) || null : null;

    await client.execute({
      sql: `INSERT OR REPLACE INTO match_events (match_id, thesportsdb_event_id, event_type, event_subtype, event_time, event_description, player_id, player_name, team_id, team_name, detail, assist_player, related_player_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        match.id, toStr(raw.idTimelineEvent) || toStr(raw.idEvent),
        toStr(raw.strEvent) || toStr(raw.intTime) || "unknown",
        toStr(raw.strEventAlternate) || null, toStr(raw.intTime),
        toStr(raw.strDescription) || null, null,
        toStr(raw.strPlayer), teamId, teamName,
        toStr(raw.strDetail) || null, toStr(raw.strAssist) || null, null,
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} match events upserted`);
  return inserted;
}
