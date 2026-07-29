import { getInjuries } from "../../src/lib/api/bigballs";
import { storeBBDInjuries } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchInjuries() {
  log("fetch-injuries", "Fetching injuries");
  const injuries = await getInjuries();
  await storeBBDInjuries(injuries);
  log("fetch-injuries", `Stored ${Array.isArray(injuries) ? injuries.length : 1} injuries`);
}
