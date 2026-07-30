import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import { LEAGUES } from "../../src/lib/leagues";
import { normalizeTeamName, resolveLeagueSlug, toStr, toInt } from "./normalization";

const log = (msg: string) => console.log(`[matches] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  // 1. Build lookups
  const teamRes = await client.execute("SELECT id, name, slug FROM teams");
  const teamByName = new Map<string, number>();
  for (const row of teamRes.rows) {
    teamByName.set(normalizeTeamName(row.name as string), row.id as number);
    if (row.slug) teamByName.set(row.slug as string, row.id as number);
  }

  const venueRes = await client.execute("SELECT id, name FROM venues");
  const venueByName = new Map<string, number>();
  for (const row of venueRes.rows) {
    venueByName.set(normalizeTeamName(row.name as string), row.id as number);
  }

  const leagueRes = await client.execute("SELECT id, slug FROM leagues");
  const leagueBySlug = new Map<string, number>();
  for (const row of leagueRes.rows) {
    leagueBySlug.set(row.slug as string, row.id as number);
  }

  // 2. Read tsdb_events + tsdb_schedule
  const eventsRes = await client.execute("SELECT raw_json FROM tsdb_events");
  const scheduleRes = await client.execute("SELECT raw_json FROM tsdb_schedule");
  const allEvents = [...eventsRes.rows, ...scheduleRes.rows];

  let inserted = 0;
  for (const row of allEvents) {
    const raw = JSON.parse(row.raw_json as string);
    const homeName = toStr(raw.strHomeTeam);
    const awayName = toStr(raw.strAwayTeam);
    const matchDate = toStr(raw.dateEvent);
    if (!homeName || !awayName || !matchDate) continue;

    const homeTeamId = teamByName.get(normalizeTeamName(homeName)) || null;
    const awayTeamId = teamByName.get(normalizeTeamName(awayName)) || null;
    const leagueName = toStr(raw.strLeague) || "unknown";
    const leagueSlug = resolveLeagueSlug(leagueName);
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const venueName = toStr(raw.strVenue);
    const venueId = venueName ? venueByName.get(normalizeTeamName(venueName)) || null : null;

    await client.execute({
      sql: `INSERT INTO matches (source, external_id, thesportsdb_id, league_slug, league_id, season, matchday, status, home_team_id, home_team_name, home_score, away_team_id, away_team_name, away_score, match_date, match_time, venue, venue_id, spectators, weather, home_team_badge, away_team_badge, poster_url, thumb_url, banner_url, square_url, video_url, api_football_id)
            VALUES ('thesportsdb', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(home_team_name, away_team_name, match_date, season) DO UPDATE SET
              thesportsdb_id=excluded.thesportsdb_id, league_id=excluded.league_id,
              status=excluded.status, home_team_id=excluded.home_team_id,
              home_score=excluded.home_score, away_team_id=excluded.away_team_id,
              away_score=excluded.away_score, match_time=excluded.match_time,
              venue=excluded.venue, venue_id=excluded.venue_id,
              spectators=excluded.spectators, weather=excluded.weather,
              home_team_badge=excluded.home_team_badge, away_team_badge=excluded.away_team_badge,
              poster_url=excluded.poster_url, thumb_url=excluded.thumb_url,
              banner_url=excluded.banner_url, square_url=excluded.square_url,
              video_url=excluded.video_url`,
      args: [
        toStr(raw.idEvent), toStr(raw.idEvent), toStr(raw.idLeague), leagueId,
        toStr(raw.strSeason), toInt(raw.intRound), toStr(raw.strStatus),
        homeTeamId, homeName, toInt(raw.intHomeScore),
        awayTeamId, awayName, toInt(raw.intAwayScore),
        matchDate, toStr(raw.strTime), venueName, venueId,
        toInt(raw.intSpectators), toStr(raw.strWeather),
        toStr(raw.strHomeTeamBadge), toStr(raw.strAwayTeamBadge),
        toStr(raw.strPoster), toStr(raw.strThumb), toStr(raw.strBanner),
        toStr(raw.strSquare), toStr(raw.strVideo), toStr(raw.idAPIfootball),
      ],
    });
    inserted++;
  }

  // Also pull from fbdo_match_detail
  const fdCodeToSlug = new Map<string, string>();
  for (const l of LEAGUES) {
    if (l.footballDataCode) fdCodeToSlug.set(l.footballDataCode, l.slug);
  }

  const fdRes = await client.execute(
    "SELECT competition_code, season, matchday, status, home_team_name, away_team_name, home_score, away_score, match_date, match_time, venue, attendance FROM fbdo_match_detail"
  );
  for (const row of fdRes.rows) {
    const code = row.competition_code as string;
    const leagueSlug = fdCodeToSlug.get(code);
    if (!leagueSlug) continue;

    const homeName = row.home_team_name as string;
    const awayName = row.away_team_name as string;
    const matchDate = row.match_date as string;
    if (!homeName || !awayName || !matchDate) continue;

    const homeTeamId = teamByName.get(normalizeTeamName(homeName)) || null;
    const awayTeamId = teamByName.get(normalizeTeamName(awayName)) || null;
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const venueName = row.venue as string || null;
    const venueId = venueName ? venueByName.get(normalizeTeamName(venueName)) || null : null;

    await client.execute({
      sql: `INSERT INTO matches (source, league_slug, league_id, season, matchday, status, home_team_id, home_team_name, home_score, away_team_id, away_team_name, away_score, match_date, match_time, venue, venue_id, spectators)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(home_team_name, away_team_name, match_date, season) DO UPDATE SET
              status=excluded.status, home_score=excluded.home_score, away_score=excluded.away_score,
              match_time=excluded.match_time, venue=excluded.venue, venue_id=excluded.venue_id,
              spectators=excluded.spectators`,
      args: [
        "footballdata", leagueSlug, leagueId,
        toStr(row.season), toInt(row.matchday), toStr(row.status),
        homeTeamId, homeName, toInt(row.home_score),
        awayTeamId, awayName, toInt(row.away_score),
        matchDate, toStr(row.match_time), venueName, venueId,
        toInt(row.attendance),
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} matches upserted`);
  return inserted;
}
