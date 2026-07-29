import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { normalizeName, normalizeTeamName, toStr } from "./normalization";

const log = (msg: string) => console.log(`[players] ${msg}`);

const UPSERT_SQL = `INSERT INTO players (source, external_id, thesportsdb_id, bbd_id, name, slug, short_name, team_id, position, nationality, date_of_birth, date_of_death, height, photo_url, cutout_url, description, birth_location, status, jersey_number, wikidata_id, transfermarkt_id)
  VALUES ('thesportsdb', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(external_id) DO UPDATE SET
    thesportsdb_id=COALESCE(excluded.thesportsdb_id, players.thesportsdb_id),
    bbd_id=COALESCE(excluded.bbd_id, players.bbd_id),
    name=excluded.name, slug=excluded.slug,
    short_name=COALESCE(excluded.short_name, players.short_name),
    team_id=COALESCE(excluded.team_id, players.team_id),
    position=COALESCE(excluded.position, players.position),
    nationality=COALESCE(excluded.nationality, players.nationality),
    date_of_birth=COALESCE(excluded.date_of_birth, players.date_of_birth),
    date_of_death=COALESCE(excluded.date_of_death, players.date_of_death),
    height=COALESCE(excluded.height, players.height),
    photo_url=COALESCE(excluded.photo_url, players.photo_url),
    cutout_url=COALESCE(excluded.cutout_url, players.cutout_url),
    description=COALESCE(excluded.description, players.description),
    birth_location=COALESCE(excluded.birth_location, players.birth_location),
    status=COALESCE(excluded.status, players.status),
    jersey_number=COALESCE(excluded.jersey_number, players.jersey_number),
    wikidata_id=COALESCE(excluded.wikidata_id, players.wikidata_id),
    transfermarkt_id=COALESCE(excluded.transfermarkt_id, players.transfermarkt_id),
    updated_at=datetime('now')`;

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const teamRes = await client.execute("SELECT id, name, slug FROM teams");
  const teamByName = new Map<string, number>();
  for (const row of teamRes.rows) {
    teamByName.set(normalizeTeamName(row.name as string), row.id as number);
    if (row.slug) teamByName.set(row.slug as string, row.id as number);
  }

  const tsdbRes = await client.execute("SELECT tsdb_id, raw_json FROM tsdb_players");
  const playersByNorm = new Map<string, Record<string, unknown>>();
  for (const row of tsdbRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const name = toStr(raw.strPlayer);
    const teamName = toStr(raw.strTeam);
    if (!name) continue;
    const teamId = teamName ? teamByName.get(normalizeTeamName(teamName)) || null : null;
    const key = `${normalizeName(name)}:${teamId || "none"}`;
    playersByNorm.set(key, raw);
  }

  const bbdRes = await client.execute("SELECT raw_json FROM bbd_players");
  const bbdByName = new Map<string, Record<string, unknown>>();
  for (const row of bbdRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const name = toStr(raw.name);
    if (!name) continue;
    bbdByName.set(normalizeName(name.trim()), raw);
  }

  // Batch inserts in groups of 100
  const BATCH_SIZE = 100;
  const entries = Array.from(playersByNorm.entries());
  let inserted = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const statements = batch.map(([key, raw]) => {
      const name = toStr(raw.strPlayer) || "";
      const teamId = key.split(":")[1];
      const teamIdNum = teamId && teamId !== "none" ? Number(teamId) : null;
      const bbd = bbdByName.get(normalizeName(name));

      return {
        sql: UPSERT_SQL,
        args: [
          toStr(raw.idPlayer), toStr(raw.idPlayer), toStr(bbd?.id as string),
          name, normalizeName(name).replace(/\s+/g, "-"),
          toStr(raw.strPlayerAlternate)?.split(",")[0] || null,
          teamIdNum || null, toStr(raw.strPosition) || null,
          toStr(raw.strNationality), toStr(raw.dateBorn), toStr(raw.dateDied),
          toStr(raw.strHeight), toStr(raw.strThumb) || toStr(raw.strCutout),
          toStr(raw.strCutout), toStr(raw.strDescriptionEN),
          toStr(raw.strBirthLocation), toStr(raw.strStatus),
          (bbd?.jersey_number as string) || toStr(raw.strNumber), toStr(raw.idWikidata),
          toStr(raw.idTransferMkt),
        ],
      };
    });

    await client.batch(statements);
    inserted += batch.length;
    if (inserted % 500 === 0) log(`  ... ${inserted}/${entries.length}`);
  }

  log(`Done: ${inserted} players upserted`);
  return inserted;
}
