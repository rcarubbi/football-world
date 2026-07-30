import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { LEAGUES } from "../../src/lib/leagues";
import { normalizeTeamName, resolveLeagueSlug, toStr, toInt } from "./normalization";

const log = (msg: string) => console.log(`[teams] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  // 1. Read tsdb_teams (primary source)
  const tsdbRes = await client.execute("SELECT tsdb_id, raw_json FROM tsdb_teams");
  const teamsByName = new Map<string, Record<string, unknown>>();

  for (const row of tsdbRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const name = toStr(raw.strTeam);
    if (!name) continue;
    const key = normalizeTeamName(name);
    teamsByName.set(key, raw);
  }

  // 2. Read sap_teams for color data
  const sapRes = await client.execute("SELECT sap_id, raw_json FROM sap_teams");
  const sapColors = new Map<string, { primary: string; secondary: string; shortName: string }>();
  for (const row of sapRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const team = raw.team || raw;
    const name = toStr(team.name) || toStr(team.shortName);
    if (!name) continue;
    const key = normalizeTeamName(name);
    sapColors.set(key, {
      primary: toStr(team.primaryColorHex) || toStr(team.primaryColor) || null!,
      secondary: toStr(team.secondaryColorHex) || toStr(team.secondaryColor) || null!,
      shortName: toStr(team.shortName) || null!,
    });
  }

  // 3. Read venue lookup (name → id)
  const venueRes = await client.execute("SELECT id, name FROM venues");
  const venueByName = new Map<string, number>();
  for (const row of venueRes.rows) {
    venueByName.set(normalizeTeamName(row.name as string), row.id as number);
  }

  // 4. Resolve league lookup
  const leagueRes = await client.execute("SELECT id, slug FROM leagues");
  const leagueBySlug = new Map<string, number>();
  for (const row of leagueRes.rows) {
    leagueBySlug.set(row.slug as string, row.id as number);
  }

  // 5. Upsert
  let inserted = 0;
  for (const [key, raw] of teamsByName) {
    const name = toStr(raw.strTeam) || key;
    const slug = normalizeTeamName(name).replace(/\s+/g, "-");
    const leagueName = toStr(raw.strLeague) || toStr(raw.strCountry) || "unknown";
    const leagueSlug = resolveLeagueSlug(leagueName);

    const sap = sapColors.get(key);
    const venueName = toStr(raw.strStadium);
    const venueId = venueName ? venueByName.get(normalizeTeamName(venueName)) || null : null;

    const badgeUrl = toStr(raw.strBadge) || toStr(raw.strLogo);
    const kitHome = toStr(raw.strEquipment) || toStr(raw.strKitHome);

    await client.execute({
      sql: `INSERT INTO teams (source, external_id, thesportsdb_id, sportsapipro_id, name, slug, short_name, badge_url, kit_home_url, founded, stadium, location, league_slug, description, primary_color, secondary_color, capacity, venue_id, website, banner_url, equipment_url)
            VALUES ('thesportsdb', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(external_id) DO UPDATE SET
              thesportsdb_id=excluded.thesportsdb_id, name=excluded.name, slug=excluded.slug,
              short_name=COALESCE(excluded.short_name, teams.short_name),
              badge_url=COALESCE(excluded.badge_url, teams.badge_url),
              kit_home_url=COALESCE(excluded.kit_home_url, teams.kit_home_url),
              founded=COALESCE(excluded.founded, teams.founded),
              stadium=COALESCE(excluded.stadium, teams.stadium),
              location=COALESCE(excluded.location, teams.location),
              league_slug=excluded.league_slug,
              description=COALESCE(excluded.description, teams.description),
              primary_color=COALESCE(excluded.primary_color, teams.primary_color),
              secondary_color=COALESCE(excluded.secondary_color, teams.secondary_color),
              capacity=COALESCE(excluded.capacity, teams.capacity),
              venue_id=COALESCE(excluded.venue_id, teams.venue_id),
              website=COALESCE(excluded.website, teams.website),
              banner_url=COALESCE(excluded.banner_url, teams.banner_url),
              equipment_url=COALESCE(excluded.equipment_url, teams.equipment_url),
              updated_at=datetime('now')`,
      args: [
        toStr(raw.idTeam), toStr(raw.idTeam), name, slug,
        sap?.shortName || toStr(raw.strTeamAlternate), badgeUrl, kitHome,
        toStr(raw.intFormedYear), toStr(raw.strStadium), toStr(raw.strLocation),
        leagueSlug, toStr(raw.strDescriptionEN), sap?.primary || null, sap?.secondary || null,
        toInt(raw.intStadiumCapacity), venueId, toStr(raw.strWebsite),
        toStr(raw.strBanner), toStr(raw.strEquipment),
      ],
    });
    inserted++;
  }

  // Also pull from fbdo_teams
  const fdCodeToSlug = new Map<string, string>();
  for (const l of LEAGUES) {
    if (l.footballDataCode) fdCodeToSlug.set(l.footballDataCode, l.slug);
  }

  const fdRes = await client.execute(
    "SELECT fd_id, competition_code, name, short_name, crest_url, address, founded, venue FROM fbdo_teams"
  );
  for (const row of fdRes.rows) {
    const code = row.competition_code as string;
    const leagueSlug = fdCodeToSlug.get(code);
    if (!leagueSlug) continue;
    const name = row.name as string;
    if (!name) continue;
    const slug = normalizeTeamName(name).replace(/\s+/g, "-");
    const shortName = row.short_name as string || null;
    const badgeUrl = row.crest_url as string || null;
    const venueName = row.venue as string || null;

    await client.execute({
      sql: `INSERT INTO teams (source, external_id, football_data_id, name, slug, short_name, badge_url, founded, location, stadium, league_slug)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
              football_data_id=COALESCE(excluded.football_data_id, teams.football_data_id),
              name=excluded.name,
              short_name=COALESCE(excluded.short_name, teams.short_name),
              badge_url=COALESCE(excluded.badge_url, teams.badge_url),
              founded=COALESCE(excluded.founded, teams.founded),
              stadium=COALESCE(excluded.stadium, teams.stadium),
              updated_at=datetime('now')`,
      args: [
        "footballdata", "fd-" + (row.fd_id as number), row.fd_id as number,
        name, slug, shortName, badgeUrl,
        toStr(row.founded), toStr(row.address), venueName, leagueSlug,
      ],
    });
    inserted++;
  }

  // Also pull from tsdb_team_equipment for kit URLs
  const equipRes = await client.execute("SELECT team_tsdb_id, raw_json FROM tsdb_team_equipment WHERE raw_json IS NOT NULL");
  const kitsByTeam = new Map<string, { home: string | null; away: string | null }>();
  for (const row of equipRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    const teamTsdbId = raw.idTeam as string;
    const url = raw.strEquipment as string;
    const type = (raw.strType as string || "").toLowerCase();
    if (!teamTsdbId || !url) continue;
    let kit = kitsByTeam.get(teamTsdbId);
    if (!kit) { kit = { home: null, away: null }; kitsByTeam.set(teamTsdbId, kit); }
    if (type.startsWith("1st") || type.startsWith("home") || (!kit.home)) kit.home = url;
    else if (type.startsWith("2nd") || type.startsWith("away")) kit.away = url;
  }
  for (const [tsdbId, kit] of kitsByTeam) {
    const r = await client.execute({
      sql: "UPDATE teams SET kit_home_url=COALESCE(?, kit_home_url), kit_away_url=COALESCE(?, kit_away_url), updated_at=datetime('now') WHERE thesportsdb_id=?",
      args: [kit.home, kit.away, tsdbId],
    });
    if (r.rowsAffected > 0) inserted++;
  }

  // Also pull from fbdo_team_detail for extra team info
  const fdDetailRes = await client.execute(
    "SELECT fd_id, name, crest_url, venue, founded, coach_name, address, website FROM fbdo_team_detail"
  );
  for (const row of fdDetailRes.rows) {
    const name = row.name as string;
    if (!name) continue;
    const slug = normalizeTeamName(name).replace(/\s+/g, "-");

    await client.execute({
      sql: `INSERT INTO teams (source, external_id, football_data_id, name, slug, short_name, badge_url, founded, stadium, location, league_slug)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 'unknown')
            ON CONFLICT(slug) DO UPDATE SET
              football_data_id=COALESCE(excluded.football_data_id, teams.football_data_id),
              name=excluded.name,
              badge_url=COALESCE(excluded.badge_url, teams.badge_url),
              founded=COALESCE(?, teams.founded),
              stadium=COALESCE(?, teams.stadium),
              website=COALESCE(?, teams.website),
              updated_at=datetime('now')`,
      args: [
        "footballdata", "fd-" + (row.fd_id as number) + "-detail", row.fd_id as number,
        name, slug, row.crest_url as string || null,
        toStr(row.founded), toStr(row.venue), toStr(row.address),
        toStr(row.founded), toStr(row.venue), toStr(row.website),
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} teams upserted`);
  return inserted;
}
