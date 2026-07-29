import { getLeagues } from "../../src/lib/api/bigballs";
import { storeBBDLeagues } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchLeagues() {
  log("fetch-leagues", "Fetching leagues");
  const leagues = await getLeagues();
  await storeBBDLeagues(leagues);
  log("fetch-leagues", `Stored ${Array.isArray(leagues) ? leagues.length : 1} leagues`);
}
