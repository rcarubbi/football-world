import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { toInt, toStr } from "./normalization";

const log = (msg: string) => console.log(`[venues] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");
  const res = await client.execute("SELECT tsdb_id, raw_json FROM tsdb_venues");

  let inserted = 0;
  for (const row of res.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const capacity = toInt(raw.intCapacity);
    const formedYear = toStr(raw.intFormedYear);

    await client.execute({
      sql: `INSERT INTO venues (thesportsdb_id, name, alternate_name, capacity, cost, country, location, timezone, formed_year, description, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(thesportsdb_id) DO UPDATE SET
              name=excluded.name, alternate_name=excluded.alternate_name, capacity=excluded.capacity,
              cost=excluded.cost, country=excluded.country, location=excluded.location,
              timezone=excluded.timezone, formed_year=excluded.formed_year,
              description=COALESCE(excluded.description, venues.description),
              image_url=COALESCE(excluded.image_url, venues.image_url)`,
      args: [
        toStr(raw.idVenue), toStr(raw.strVenue), toStr(raw.strVenueAlternate),
        capacity, toStr(raw.strCost), toStr(raw.strCountry), toStr(raw.strLocation),
        toStr(raw.strTimezone), formedYear, toStr(raw.strDescriptionEN),
        toStr(raw.strFanart1),
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} venues upserted`);
  return inserted;
}
