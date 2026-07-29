import { getEventsLast, getEventsNext } from "../../src/lib/api/sportsapipro";
import { storeSAPMatches } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchMatches(
  leagues: { sapTournamentId: number; sapSeasonId: number; name: string }[],
  maxPages = 10
) {
  for (const league of leagues) {
    log("fetch-matches", `Fetching events for ${league.name}`);
    let page = 0;
    let totalStored = 0;
    let fetchFn: typeof getEventsLast = getEventsLast;
    while (page < maxPages) {
      try {
        const data = await fetchFn(league.sapTournamentId, league.sapSeasonId, page);
        if (!data) {
          if (fetchFn === getEventsLast) {
            log("fetch-matches", `No past events, trying upcoming events`);
            fetchFn = getEventsNext;
            page = 0;
            continue;
          }
          break;
        }
        const events = (data as { events?: unknown[] }).events;
        if (!events || events.length === 0) break;
        await storeSAPMatches(league.sapTournamentId, league.sapSeasonId, data);
        totalStored += events.length;
        page++;
      } catch (err) {
        log("fetch-matches", `Error fetching page ${page} for ${league.name}: ${err}`);
        break;
      }
    }
    log("fetch-matches", `Stored ${totalStored} events (${page} pages) for ${league.name}`);
  }
}
