import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";

import { resolveLeagueSlug, normalizeName, toStr, toInt } from "./normalization";

const log = (msg: string) => console.log(`[scorers] ${msg}`);

export async function runEtl(client: ReturnType<typeof getTursoClient>) {
  log("Starting...");

  const leagueRes = await client.execute("SELECT id, slug FROM leagues");
  const leagueBySlug = new Map<string, number>();
  for (const row of leagueRes.rows) {
    leagueBySlug.set(row.slug as string, row.id as number);
  }

  // Build players slug lookup for fuzzy matching
  const playerRes = await client.execute("SELECT slug, name, photo_url FROM players");
  const playerBySlug = new Map<string, { name: string; photoUrl: string | null }>();
  const playerByLastName = new Map<string, { slug: string; name: string; photoUrl: string | null }>();
  for (const row of playerRes.rows) {
    const name = row.name as string;
    const slug = row.slug as string;
    const photoUrl = (row.photo_url as string) || null;
    playerBySlug.set(slug, { name, photoUrl });
    const lastName = name.split(" ").pop()?.toLowerCase() || "";
    if (lastName) playerByLastName.set(lastName, { slug, name, photoUrl });
  }
  log(`  Players indexed: ${playerBySlug.size} slugs, ${playerByLastName.size} last names`);

  // Resolve player slug with fuzzy fallback for abbreviated names
  function resolvePlayerSlug(playerName: string): { slug: string; photoUrl: string | null } {
    const directSlug = normalizeName(playerName).replace(/\s+/g, "-");
    const exact = playerBySlug.get(directSlug);
    if (exact) return { slug: directSlug, photoUrl: exact.photoUrl };

    // Fuzzy: extract last name and try to match
    const parts = playerName.split(" ").filter(Boolean);
    const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/\./g, "") : "";
    if (lastName) {
      const fuzzy = playerByLastName.get(lastName);
      if (fuzzy) return { slug: fuzzy.slug, photoUrl: fuzzy.photoUrl };
    }
    return { slug: directSlug, photoUrl: null };
  }

  // Pull from SAP top_players
  const sapRes = await client.execute("SELECT raw_json FROM sap_top_players");
  let inserted = 0;

  for (const row of sapRes.rows) {
    const raw = JSON.parse(row.raw_json as string);
    if (!raw) continue;
    const tournamentName = raw.uniqueTournament?.name || raw.tournament?.name || "unknown";
    const leagueSlug = resolveLeagueSlug(tournamentName);
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = raw.season?.name || null;

    const allPlayers: any[] = [];
    if (Array.isArray(raw.topPlayers)) {
      allPlayers.push(...raw.topPlayers);
    } else if (raw.topPlayers && typeof raw.topPlayers === "object") {
      for (const cat of Object.values(raw.topPlayers) as any) {
        if (Array.isArray(cat)) allPlayers.push(...cat);
      }
    }
    for (const entry of allPlayers) {
      const playerName = entry.player?.name || entry.name;
      if (!playerName) continue;

      const teamName = entry.team?.name;

      const { slug, photoUrl } = resolvePlayerSlug(playerName);
      const sapPhoto = toStr(entry.player?.imagePath) || toStr(entry.imagePath);
      await client.execute({
        sql: `INSERT INTO top_scorers (league_id, league_slug, season, player_id, player_name, player_slug, team_name, goals, assists, appearances, position, jersey_number, nationality, photo_url, source)
              VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(player_name, league_slug, season) DO UPDATE SET
                goals=excluded.goals, assists=excluded.assists,
                appearances=excluded.appearances,
                photo_url=COALESCE(excluded.photo_url, top_scorers.photo_url),
                updated_at=datetime('now')`,
        args: [
          leagueId, leagueSlug, seasonName, playerName, slug,
          teamName, toInt(entry.goals) || toInt(entry.totalGoals),
          toInt(entry.assists), toInt(entry.appearances) || toInt(entry.matchesAppearances),
          toStr(entry.position) || toStr(entry.field),
          toInt(entry.jerseyNumber) || toInt(entry.shirtNumber),
          toStr(entry.nationality), sapPhoto || photoUrl,
          "sportsapipro",
        ],
      });
      inserted++;
    }
  }

  // Also pull from bbd_scorers
  // Build bbd_id → league_slug from leagues table
  const leagueBbdRes = await client.execute("SELECT slug, bbd_id FROM leagues WHERE bbd_id IS NOT NULL");
  const bbdIdToSlug = new Map<string, string>();
  for (const row of leagueBbdRes.rows) {
    bbdIdToSlug.set(row.bbd_id as string, row.slug as string);
  }

  const bbdRes = await client.execute("SELECT league_id, season, category, raw_json FROM bbd_scorers");
  for (const row of bbdRes.rows) {
    const bbdLeagueId = row.league_id as string;
    const leagueSlug = bbdIdToSlug.get(bbdLeagueId) || bbdLeagueId;
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = row.season as string || null;
    const category = row.category as string;

    const raw = JSON.parse(row.raw_json as string);
      const entries = Array.isArray(raw) ? raw : (Array.isArray(raw.scorers) ? raw.scorers : Array.isArray(raw.players) ? raw.players : []);
    for (const entry of entries) {
      const playerName = entry.player?.name || entry.player_name || entry.name;
      if (!playerName) continue;

      const teamName = entry.team?.name || entry.team_name || entry.team;

      const { slug, photoUrl } = resolvePlayerSlug(playerName);
      // For goals category: set goals; for others: set the relevant field
      const goals = category === "goals" ? toInt(entry.goals) : undefined;
      const assists = category === "assists" ? toInt(entry.assists) : undefined;
      const appearances = (category === "matches_played") ? toInt(entry.matches) || toInt(entry.appearances) : undefined;

      await client.execute({
        sql: `INSERT INTO top_scorers (league_id, league_slug, season, player_id, player_name, player_slug, team_name, goals, assists, appearances, position, jersey_number, nationality, photo_url, source)
              VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(player_name, league_slug, season) DO UPDATE SET
                goals=COALESCE(excluded.goals, top_scorers.goals),
                assists=COALESCE(excluded.assists, top_scorers.assists),
                appearances=COALESCE(excluded.appearances, top_scorers.appearances),
                photo_url=COALESCE(excluded.photo_url, top_scorers.photo_url),
                updated_at=datetime('now')`,
        args: [
          leagueId, leagueSlug, seasonName, playerName, slug,
          teamName, goals ?? null, assists ?? null, appearances ?? null,
          toStr(entry.position), null, toStr(entry.nationality),
          photoUrl || toStr(entry.player?.image_path) || toStr(entry.image_path),
          "bbd",
        ],
      });
      inserted++;
    }
  }

  // Also pull from fbdo_scorers
  const fdCodeRes = await client.execute("SELECT slug, football_data_code FROM leagues WHERE football_data_code IS NOT NULL");
  const fdCodeToSlug = new Map<string, string>();
  for (const row of fdCodeRes.rows) {
    fdCodeToSlug.set(row.football_data_code as string, row.slug as string);
  }

  const fdRes = await client.execute(
    "SELECT competition_code, season, player_name, team_name, goals, assists, penalties FROM fbdo_scorers ORDER BY competition_code, season"
  );
  for (const row of fdRes.rows) {
    const code = row.competition_code as string;
    const leagueSlug = fdCodeToSlug.get(code);
    if (!leagueSlug) {
      log(`  Skipping unknown FD code: ${code}`);
      continue;
    }
    const leagueId = leagueBySlug.get(leagueSlug) || null;
    const seasonName = row.season as string || null;
    const playerName = row.player_name as string || "";
    if (!playerName) continue;

    const { slug, photoUrl } = resolvePlayerSlug(playerName);
    await client.execute({
      sql: `INSERT INTO top_scorers (league_id, league_slug, season, player_id, player_name, player_slug, team_name, goals, assists, penalties, photo_url, source)
            VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(player_name, league_slug, season) DO UPDATE SET
              goals=COALESCE(excluded.goals, top_scorers.goals),
              assists=COALESCE(excluded.assists, top_scorers.assists),
              penalties=COALESCE(excluded.penalties, top_scorers.penalties),
              photo_url=COALESCE(excluded.photo_url, top_scorers.photo_url),
              updated_at=datetime('now')`,
      args: [
        leagueId, leagueSlug, seasonName, playerName, slug,
        row.team_name as string,
        toInt(row.goals), toInt(row.assists), toInt(row.penalties),
        photoUrl,
        "footballdata",
      ],
    });
    inserted++;
  }

  log(`Done: ${inserted} scorers upserted`);
  return inserted;
}
