import { getSports } from "../../src/lib/api/bigballs";
import { storeBBDSports } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchSports() {
  log("fetch-sports", "Fetching sports");
  const sports = await getSports();
  await storeBBDSports(sports);
  log("fetch-sports", `Stored ${Array.isArray(sports) ? sports.length : 1} sports`);
}
