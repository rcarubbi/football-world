import { getCountries } from "../../src/lib/api/sportsapipro";
import { storeSAPCountries } from "../../src/lib/raw/index";
import { log } from "../lib/logger";

export async function fetchCountries() {
  log("fetch-countries", "Fetching countries");
  const data = await getCountries();
  await storeSAPCountries(data);
  log("fetch-countries", `Stored countries`);
}
