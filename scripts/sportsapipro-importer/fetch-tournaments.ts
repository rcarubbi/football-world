import { getTournaments, getTournamentSeasons } from "../../src/lib/api/sportsapipro";
import { storeSAPTournaments, storeSAPTournamentSeasons } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchTournaments(skipSeasons = false) {
  log("fetch-tournaments", "Fetching all tournaments");
  const tournaments = await getTournaments();
  await storeSAPTournaments(tournaments);

  const list = (tournaments as { id?: number }[]) || [];
  log("fetch-tournaments", `Stored ${list.length} tournaments`);

  if (skipSeasons) {
    log("fetch-tournaments", "Skipping bulk season fetch (resolveSAPLeagues handles it)");
    return;
  }

  log("fetch-tournaments", `Fetching seasons for ${list.length} tournaments...`);
  let stored = 0;
  for (const t of list) {
    if (!t.id) continue;
    try {
      const seasons = await getTournamentSeasons(t.id);
      await storeSAPTournamentSeasons(t.id, seasons);
      stored++;
    } catch (err) {
      log("fetch-tournaments", `Error fetching seasons for tournament ${t.id}: ${err}`);
    }
  }
  log("fetch-tournaments", `Stored seasons for ${stored} tournaments`);
}
