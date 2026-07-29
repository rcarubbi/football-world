import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { resolveLeagueSlug, toStr } from "./normalization";

const log = (msg: string) => console.log(`[leagues] ${msg}`);

interface LeagueRow {
  bbd_id: string;
  name: string;
  slug: string;
  country: string | null;
  tsdb_id: string | null;
  badge_url: string | null;
  logo_url: string | null;
  description: string | null;
  formed_year: string | null;
  current_season: string | null;
}

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  // 1. Read from bbd_leagues (primary source for slugs)
  const bbdRes = await client.execute("SELECT raw_json FROM bbd_leagues");
  const bbdLeagues: { id: string; name: string; sport: string; country: string }[] =
    JSON.parse(bbdRes.rows[0]?.raw_json as string || "[]");

  // 2. Read from tsdb_leagues (for badges, descriptions)
  const tsdbRes = await client.execute("SELECT tsdb_id, name, badge_url, formed_year, description, raw_json FROM tsdb_leagues");
  const tsdbByName = new Map<string, typeof tsdbRes.rows[0]>();
  for (const row of tsdbRes.rows) {
    const norm = resolveLeagueSlug(row.name as string);
    tsdbByName.set(norm, row);
  }

  // 3. Build merged league rows
  const leagues = new Map<string, LeagueRow>();

  for (const bbd of bbdLeagues) {
    const slug = resolveLeagueSlug(bbd.name);
    const tsdb = tsdbByName.get(slug);
    leagues.set(slug, {
      bbd_id: bbd.id,
      name: bbd.name,
      slug,
      country: bbd.country,
      tsdb_id: tsdb?.tsdb_id as string || null,
      badge_url: (tsdb?.badge_url as string) || null,
      logo_url: null,
      description: (tsdb?.description as string) || null,
      formed_year: (tsdb?.formed_year as string) || null,
      current_season: null,
    });
  }

  // 4. Add tsdb leagues not in bbd
  for (const [slug, tsdb] of tsdbByName) {
    if (!leagues.has(slug)) {
      leagues.set(slug, {
        bbd_id: null!,
        name: tsdb.name as string,
        slug,
        country: toStr(tsdb.raw_json ? JSON.parse(tsdb.raw_json as string)?.strCountry : null) || null,
        tsdb_id: tsdb.tsdb_id as string,
        badge_url: tsdb.badge_url as string || null,
        logo_url: null,
        description: tsdb.description as string || null,
        formed_year: tsdb.formed_year as string || null,
        current_season: null,
      });
    }
  }

  // 5. Upsert
  let inserted = 0;
  let updated = 0;
  for (const [, l] of leagues) {
    const res = await client.execute({
      sql: `INSERT INTO leagues (slug, name, country, badge_url, logo_url, description, formed_year, current_season, sportsapipro_id, thesportsdb_id, bbd_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
              name=excluded.name, country=excluded.country, badge_url=COALESCE(excluded.badge_url, leagues.badge_url),
              description=COALESCE(excluded.description, leagues.description),
              formed_year=COALESCE(excluded.formed_year, leagues.formed_year),
              thesportsdb_id=COALESCE(excluded.thesportsdb_id, leagues.thesportsdb_id),
              bbd_id=COALESCE(excluded.bbd_id, leagues.bbd_id),
              updated_at=datetime('now')`,
      args: [l.slug, l.name, l.country, l.badge_url, l.logo_url, l.description, l.formed_year, l.current_season, l.tsdb_id, l.bbd_id],
    });
    if (res.rowsAffected > 0) inserted++;
    else updated++;
  }

  log(`Done: ${leagues.size} leagues (${inserted} inserted, ${updated} updated)`);
  return leagues.size;
}
