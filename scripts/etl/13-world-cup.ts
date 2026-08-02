import { config } from "dotenv";
import { resolve } from "path";
import { pathToFileURL } from "url";
config({ path: resolve(__dirname, "../../.env.local") });

import { getTursoClient } from "../../src/lib/turso/client";
import {
  getTournamentSeasons,
  getTournamentTeams,
  getEventsLast,
} from "../../src/lib/api/sportsapipro";

const WORLD_CUP_TOURNAMENT_ID = 16;
const MANUAL_FROM_YEAR = 1958; // SAP has events from 1958 onwards; 1930-1954 are hardcoded

const log = (msg: string) => console.log(`[world-cup] ${msg}`);

interface Podium {
  host: string;
  winner: string;
  runnerUp: string;
  third: string;
  fourth: string;
}

// Podium per edition (source of truth; fixes 2026 third/fourth = England/France)
const PODIUM: Record<number, Podium> = {
  1930: { host: "Uruguay", winner: "Uruguay", runnerUp: "Argentina", third: "United States", fourth: "Yugoslavia" },
  1934: { host: "Italy", winner: "Italy", runnerUp: "Czechoslovakia", third: "Germany", fourth: "Austria" },
  1938: { host: "France", winner: "Italy", runnerUp: "Hungary", third: "Brazil", fourth: "Sweden" },
  1950: { host: "Brazil", winner: "Uruguay", runnerUp: "Brazil", third: "Sweden", fourth: "Spain" },
  1954: { host: "Switzerland", winner: "West Germany", runnerUp: "Hungary", third: "Austria", fourth: "Uruguay" },
  1958: { host: "Sweden", winner: "Brazil", runnerUp: "Sweden", third: "France", fourth: "West Germany" },
  1962: { host: "Chile", winner: "Brazil", runnerUp: "Czechoslovakia", third: "Chile", fourth: "Yugoslavia" },
  1966: { host: "England", winner: "England", runnerUp: "West Germany", third: "Portugal", fourth: "Soviet Union" },
  1970: { host: "Mexico", winner: "Brazil", runnerUp: "Italy", third: "West Germany", fourth: "Uruguay" },
  1974: { host: "West Germany", winner: "West Germany", runnerUp: "Netherlands", third: "Poland", fourth: "Brazil" },
  1978: { host: "Argentina", winner: "Argentina", runnerUp: "Netherlands", third: "Brazil", fourth: "Italy" },
  1982: { host: "Spain", winner: "Italy", runnerUp: "West Germany", third: "Poland", fourth: "France" },
  1986: { host: "Mexico", winner: "Argentina", runnerUp: "West Germany", third: "France", fourth: "Belgium" },
  1990: { host: "Italy", winner: "West Germany", runnerUp: "Argentina", third: "Italy", fourth: "England" },
  1994: { host: "United States", winner: "Brazil", runnerUp: "Italy", third: "Sweden", fourth: "Bulgaria" },
  1998: { host: "France", winner: "France", runnerUp: "Brazil", third: "Croatia", fourth: "Netherlands" },
  2002: { host: "South Korea / Japan", winner: "Brazil", runnerUp: "Germany", third: "Turkey", fourth: "South Korea" },
  2006: { host: "Germany", winner: "Italy", runnerUp: "France", third: "Germany", fourth: "Portugal" },
  2010: { host: "South Africa", winner: "Spain", runnerUp: "Netherlands", third: "Germany", fourth: "Uruguay" },
  2014: { host: "Brazil", winner: "Germany", runnerUp: "Argentina", third: "Netherlands", fourth: "Brazil" },
  2018: { host: "Russia", winner: "France", runnerUp: "Croatia", third: "Belgium", fourth: "England" },
  2022: { host: "Qatar", winner: "Argentina", runnerUp: "France", third: "Croatia", fourth: "Morocco" },
  2026: { host: "USA / Canada / Mexico", winner: "Spain", runnerUp: "Argentina", third: "England", fourth: "France" },
};

interface ManualMatch {
  stage: string;
  groupName?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchDate?: string;
  venue?: string;
}

// Full match lists for editions not covered by SportsAPI Pro events (1930-1954).
// Team names match SAP naming so they align with world_cup_teams.
const MANUAL_MATCHES: Record<number, ManualMatch[]> = {
  1930: [
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "France", awayTeam: "Mexico", homeScore: 4, awayScore: 1, matchDate: "1930-07-13" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Argentina", awayTeam: "France", homeScore: 1, awayScore: 0, matchDate: "1930-07-15" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Chile", awayTeam: "Mexico", homeScore: 3, awayScore: 0, matchDate: "1930-07-16" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Chile", awayTeam: "France", homeScore: 1, awayScore: 0, matchDate: "1930-07-19" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Argentina", awayTeam: "Mexico", homeScore: 6, awayScore: 3, matchDate: "1930-07-19" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Argentina", awayTeam: "Chile", homeScore: 3, awayScore: 1, matchDate: "1930-07-22" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Yugoslavia", awayTeam: "Brazil", homeScore: 2, awayScore: 1, matchDate: "1930-07-14" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Yugoslavia", awayTeam: "Bolivia", homeScore: 4, awayScore: 0, matchDate: "1930-07-17" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Brazil", awayTeam: "Bolivia", homeScore: 4, awayScore: 0, matchDate: "1930-07-20" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Romania", awayTeam: "Peru", homeScore: 3, awayScore: 1, matchDate: "1930-07-14" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Uruguay", awayTeam: "Peru", homeScore: 1, awayScore: 0, matchDate: "1930-07-18" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Uruguay", awayTeam: "Romania", homeScore: 4, awayScore: 0, matchDate: "1930-07-21" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "USA", awayTeam: "Belgium", homeScore: 3, awayScore: 0, matchDate: "1930-07-13" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "USA", awayTeam: "Paraguay", homeScore: 3, awayScore: 0, matchDate: "1930-07-17" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "Paraguay", awayTeam: "Belgium", homeScore: 1, awayScore: 0, matchDate: "1930-07-20" },
    { stage: "SEMI_FINALS", homeTeam: "Argentina", awayTeam: "USA", homeScore: 6, awayScore: 1, matchDate: "1930-07-26" },
    { stage: "SEMI_FINALS", homeTeam: "Uruguay", awayTeam: "Yugoslavia", homeScore: 6, awayScore: 1, matchDate: "1930-07-27" },
    { stage: "FINAL", homeTeam: "Uruguay", awayTeam: "Argentina", homeScore: 4, awayScore: 2, matchDate: "1930-07-30" },
  ],
  1934: [
    { stage: "LAST_16", homeTeam: "Austria", awayTeam: "France", homeScore: 3, awayScore: 2, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Germany", awayTeam: "Belgium", homeScore: 5, awayScore: 2, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Italy", awayTeam: "USA", homeScore: 7, awayScore: 1, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Switzerland", awayTeam: "Netherlands", homeScore: 3, awayScore: 2, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Spain", awayTeam: "Brazil", homeScore: 3, awayScore: 1, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Sweden", awayTeam: "Argentina", homeScore: 3, awayScore: 2, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Czechoslovakia", awayTeam: "Romania", homeScore: 2, awayScore: 1, matchDate: "1934-05-27" },
    { stage: "LAST_16", homeTeam: "Hungary", awayTeam: "Egypt", homeScore: 4, awayScore: 2, matchDate: "1934-05-27" },
    { stage: "QUARTER_FINALS", homeTeam: "Austria", awayTeam: "Hungary", homeScore: 2, awayScore: 1, matchDate: "1934-05-31" },
    { stage: "QUARTER_FINALS", homeTeam: "Italy", awayTeam: "Spain", homeScore: 1, awayScore: 1, matchDate: "1934-05-31" },
    { stage: "QUARTER_FINALS", homeTeam: "Germany", awayTeam: "Sweden", homeScore: 2, awayScore: 1, matchDate: "1934-05-31" },
    { stage: "QUARTER_FINALS", homeTeam: "Czechoslovakia", awayTeam: "Switzerland", homeScore: 3, awayScore: 2, matchDate: "1934-05-31" },
    { stage: "QUARTER_FINALS", homeTeam: "Italy", awayTeam: "Spain", homeScore: 1, awayScore: 0, matchDate: "1934-06-01" },
    { stage: "SEMI_FINALS", homeTeam: "Italy", awayTeam: "Austria", homeScore: 1, awayScore: 0, matchDate: "1934-06-03" },
    { stage: "SEMI_FINALS", homeTeam: "Czechoslovakia", awayTeam: "Germany", homeScore: 3, awayScore: 1, matchDate: "1934-06-03" },
    { stage: "THIRD_PLACE", homeTeam: "Germany", awayTeam: "Austria", homeScore: 3, awayScore: 2, matchDate: "1934-06-07" },
    { stage: "FINAL", homeTeam: "Italy", awayTeam: "Czechoslovakia", homeScore: 2, awayScore: 1, matchDate: "1934-06-10" },
  ],
  1938: [
    { stage: "LAST_16", homeTeam: "Switzerland", awayTeam: "Germany", homeScore: 1, awayScore: 1, matchDate: "1938-06-04" },
    { stage: "LAST_16", homeTeam: "Cuba", awayTeam: "Romania", homeScore: 3, awayScore: 3, matchDate: "1938-06-05" },
    { stage: "LAST_16", homeTeam: "Hungary", awayTeam: "Dutch East Indies", homeScore: 6, awayScore: 0, matchDate: "1938-06-05" },
    { stage: "LAST_16", homeTeam: "France", awayTeam: "Belgium", homeScore: 3, awayScore: 1, matchDate: "1938-06-05" },
    { stage: "LAST_16", homeTeam: "Czechoslovakia", awayTeam: "Netherlands", homeScore: 3, awayScore: 0, matchDate: "1938-06-05" },
    { stage: "LAST_16", homeTeam: "Brazil", awayTeam: "Poland", homeScore: 6, awayScore: 5, matchDate: "1938-06-05" },
    { stage: "LAST_16", homeTeam: "Italy", awayTeam: "Norway", homeScore: 2, awayScore: 1, matchDate: "1938-06-05" },
    { stage: "LAST_16", homeTeam: "Switzerland", awayTeam: "Germany", homeScore: 4, awayScore: 2, matchDate: "1938-06-09" },
    { stage: "LAST_16", homeTeam: "Cuba", awayTeam: "Romania", homeScore: 2, awayScore: 1, matchDate: "1938-06-09" },
    { stage: "QUARTER_FINALS", homeTeam: "Sweden", awayTeam: "Cuba", homeScore: 8, awayScore: 0, matchDate: "1938-06-12" },
    { stage: "QUARTER_FINALS", homeTeam: "Hungary", awayTeam: "Switzerland", homeScore: 2, awayScore: 0, matchDate: "1938-06-12" },
    { stage: "QUARTER_FINALS", homeTeam: "Brazil", awayTeam: "Czechoslovakia", homeScore: 1, awayScore: 1, matchDate: "1938-06-12" },
    { stage: "QUARTER_FINALS", homeTeam: "Italy", awayTeam: "France", homeScore: 3, awayScore: 1, matchDate: "1938-06-12" },
    { stage: "QUARTER_FINALS", homeTeam: "Brazil", awayTeam: "Czechoslovakia", homeScore: 2, awayScore: 1, matchDate: "1938-06-14" },
    { stage: "SEMI_FINALS", homeTeam: "Italy", awayTeam: "Brazil", homeScore: 2, awayScore: 1, matchDate: "1938-06-16" },
    { stage: "SEMI_FINALS", homeTeam: "Hungary", awayTeam: "Sweden", homeScore: 5, awayScore: 1, matchDate: "1938-06-16" },
    { stage: "THIRD_PLACE", homeTeam: "Brazil", awayTeam: "Sweden", homeScore: 4, awayScore: 2, matchDate: "1938-06-19" },
    { stage: "FINAL", homeTeam: "Italy", awayTeam: "Hungary", homeScore: 4, awayScore: 2, matchDate: "1938-06-19" },
  ],
  1950: [
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Brazil", awayTeam: "Mexico", homeScore: 4, awayScore: 0, matchDate: "1950-06-24" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Yugoslavia", awayTeam: "Switzerland", homeScore: 3, awayScore: 0, matchDate: "1950-06-25" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Yugoslavia", awayTeam: "Mexico", homeScore: 4, awayScore: 1, matchDate: "1950-06-28" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Brazil", awayTeam: "Switzerland", homeScore: 2, awayScore: 0, matchDate: "1950-06-28" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Brazil", awayTeam: "Yugoslavia", homeScore: 2, awayScore: 0, matchDate: "1950-07-01" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Switzerland", awayTeam: "Mexico", homeScore: 2, awayScore: 1, matchDate: "1950-07-02" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "England", awayTeam: "Chile", homeScore: 2, awayScore: 0, matchDate: "1950-06-25" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Spain", awayTeam: "USA", homeScore: 3, awayScore: 1, matchDate: "1950-06-25" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Spain", awayTeam: "Chile", homeScore: 2, awayScore: 0, matchDate: "1950-06-29" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "USA", awayTeam: "England", homeScore: 1, awayScore: 0, matchDate: "1950-06-29" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Spain", awayTeam: "England", homeScore: 1, awayScore: 0, matchDate: "1950-07-02" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Chile", awayTeam: "USA", homeScore: 5, awayScore: 2, matchDate: "1950-06-25" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Sweden", awayTeam: "Italy", homeScore: 3, awayScore: 2, matchDate: "1950-06-25" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Sweden", awayTeam: "Paraguay", homeScore: 2, awayScore: 1, matchDate: "1950-06-29" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Italy", awayTeam: "Paraguay", homeScore: 2, awayScore: 0, matchDate: "1950-07-02" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "Uruguay", awayTeam: "Bolivia", homeScore: 8, awayScore: 0, matchDate: "1950-07-02" },
    { stage: "GROUP_STAGE", groupName: "FINAL_ROUND", homeTeam: "Brazil", awayTeam: "Sweden", homeScore: 7, awayScore: 1, matchDate: "1950-07-09" },
    { stage: "GROUP_STAGE", groupName: "FINAL_ROUND", homeTeam: "Uruguay", awayTeam: "Spain", homeScore: 2, awayScore: 2, matchDate: "1950-07-09" },
    { stage: "GROUP_STAGE", groupName: "FINAL_ROUND", homeTeam: "Brazil", awayTeam: "Spain", homeScore: 6, awayScore: 1, matchDate: "1950-07-13" },
    { stage: "GROUP_STAGE", groupName: "FINAL_ROUND", homeTeam: "Uruguay", awayTeam: "Sweden", homeScore: 3, awayScore: 2, matchDate: "1950-07-16" },
    { stage: "GROUP_STAGE", groupName: "FINAL_ROUND", homeTeam: "Uruguay", awayTeam: "Brazil", homeScore: 2, awayScore: 1, matchDate: "1950-07-16" },
    { stage: "GROUP_STAGE", groupName: "FINAL_ROUND", homeTeam: "Sweden", awayTeam: "Spain", homeScore: 3, awayScore: 1, matchDate: "1950-07-16" },
  ],
  1954: [
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Brazil", awayTeam: "Mexico", homeScore: 5, awayScore: 0, matchDate: "1954-06-16" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Yugoslavia", awayTeam: "France", homeScore: 1, awayScore: 0, matchDate: "1954-06-16" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "Brazil", awayTeam: "Yugoslavia", homeScore: 1, awayScore: 1, matchDate: "1954-06-19" },
    { stage: "GROUP_STAGE", groupName: "GROUP_1", homeTeam: "France", awayTeam: "Mexico", homeScore: 3, awayScore: 2, matchDate: "1954-06-19" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "West Germany", awayTeam: "Türkiye", homeScore: 4, awayScore: 1, matchDate: "1954-06-17" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Hungary", awayTeam: "South Korea", homeScore: 9, awayScore: 0, matchDate: "1954-06-17" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Hungary", awayTeam: "West Germany", homeScore: 8, awayScore: 3, matchDate: "1954-06-20" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "Türkiye", awayTeam: "South Korea", homeScore: 7, awayScore: 0, matchDate: "1954-06-20" },
    { stage: "GROUP_STAGE", groupName: "GROUP_2", homeTeam: "West Germany", awayTeam: "Türkiye", homeScore: 7, awayScore: 2, matchDate: "1954-06-23" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Uruguay", awayTeam: "Czechoslovakia", homeScore: 2, awayScore: 0, matchDate: "1954-06-16" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Austria", awayTeam: "Scotland", homeScore: 1, awayScore: 0, matchDate: "1954-06-16" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Uruguay", awayTeam: "Scotland", homeScore: 7, awayScore: 0, matchDate: "1954-06-19" },
    { stage: "GROUP_STAGE", groupName: "GROUP_3", homeTeam: "Austria", awayTeam: "Czechoslovakia", homeScore: 5, awayScore: 0, matchDate: "1954-06-19" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "England", awayTeam: "Belgium", homeScore: 4, awayScore: 4, matchDate: "1954-06-17" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "Switzerland", awayTeam: "Italy", homeScore: 2, awayScore: 1, matchDate: "1954-06-17" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "England", awayTeam: "Switzerland", homeScore: 2, awayScore: 0, matchDate: "1954-06-20" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "Italy", awayTeam: "Belgium", homeScore: 4, awayScore: 1, matchDate: "1954-06-20" },
    { stage: "GROUP_STAGE", groupName: "GROUP_4", homeTeam: "Switzerland", awayTeam: "Italy", homeScore: 4, awayScore: 1, matchDate: "1954-06-23" },
    { stage: "QUARTER_FINALS", homeTeam: "Austria", awayTeam: "Switzerland", homeScore: 7, awayScore: 5, matchDate: "1954-06-26" },
    { stage: "QUARTER_FINALS", homeTeam: "Uruguay", awayTeam: "England", homeScore: 4, awayScore: 2, matchDate: "1954-06-26" },
    { stage: "QUARTER_FINALS", homeTeam: "Hungary", awayTeam: "Brazil", homeScore: 4, awayScore: 2, matchDate: "1954-06-27" },
    { stage: "QUARTER_FINALS", homeTeam: "West Germany", awayTeam: "Yugoslavia", homeScore: 2, awayScore: 0, matchDate: "1954-06-27" },
    { stage: "SEMI_FINALS", homeTeam: "West Germany", awayTeam: "Austria", homeScore: 6, awayScore: 1, matchDate: "1954-06-30" },
    { stage: "SEMI_FINALS", homeTeam: "Hungary", awayTeam: "Uruguay", homeScore: 4, awayScore: 2, matchDate: "1954-07-01" },
    { stage: "THIRD_PLACE", homeTeam: "Austria", awayTeam: "Uruguay", homeScore: 3, awayScore: 1, matchDate: "1954-07-03" },
    { stage: "FINAL", homeTeam: "West Germany", awayTeam: "Hungary", homeScore: 3, awayScore: 2, matchDate: "1954-07-04" },
  ],
};

function normalizeGroupName(groupName: string | null | undefined): string | null {
  if (!groupName) return null;
  const m = groupName.trim().match(/^Group\s+([A-Za-z0-9]+)$/i);
  if (m) return `GROUP_${m[1].toUpperCase()}`;
  return groupName.trim().toUpperCase().replace(/\s+/g, "_");
}

function mapStage(event: any): string {
  if (event?.tournament?.isGroup) return "GROUP_STAGE";
  const name = (event?.roundInfo?.name || event?.roundInfo?.slug || "").toLowerCase();
  if (name.includes("round of 32")) return "LAST_32";
  if (name.includes("round of 16")) return "LAST_16";
  if (name.includes("quarter")) return "QUARTER_FINALS";
  if (name.includes("semi")) return "SEMI_FINALS";
  if (name.includes("3rd") || name.includes("third place")) return "THIRD_PLACE";
  if (name.includes("final")) return "FINAL";
  return "KNOCKOUT_STAGE";
}

function toScore(value: unknown): number | null {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}

async function upsertWorldCup(
  client: ReturnType<typeof getTursoClient>,
  year: number,
  podium: Podium
): Promise<number> {
  const existing = await client.execute({
    sql: "SELECT id FROM world_cups WHERE year = ?",
    args: [year],
  });

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id as number;
    await client.execute({
      sql: `UPDATE world_cups SET host_country = ?, winner = ?, runner_up = ?, third_place = ?, fourth_place = ?
            WHERE id = ?`,
      args: [podium.host, podium.winner, podium.runnerUp, podium.third, podium.fourth, id],
    });
    return id;
  }

  const result = await client.execute({
    sql: `INSERT INTO world_cups (year, host_country, winner, runner_up, third_place, fourth_place)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [year, podium.host, podium.winner, podium.runnerUp, podium.third, podium.fourth],
  });
  return Number(result.lastInsertRowid);
}

async function fetchSeasonEvents(
  tournamentId: number,
  seasonId: number,
  maxPages = 20
): Promise<unknown[]> {
  const events: unknown[] = [];
  const seen = new Set<number>();
  for (let page = 0; page < maxPages; page++) {
    const data = (await getEventsLast(tournamentId, seasonId, page)) as {
      events?: unknown[];
      hasNextPage?: boolean;
    } | null;
    if (!data?.events || data.events.length === 0) break;
    for (const event of data.events) {
      const id = (event as { id: number }).id;
      if (!seen.has(id)) {
        seen.add(id);
        events.push(event);
      }
    }
    if (!data.hasNextPage) break;
  }
  return events;
}

export async function runEtl(
  client: ReturnType<typeof getTursoClient>,
  options: { year?: number; teamsOnly?: boolean; matchesOnly?: boolean } = {}
) {
  const { year: yearFilter, teamsOnly = false, matchesOnly = false } = options;
  log(`Starting${teamsOnly ? " (teams only)" : ""}${matchesOnly ? " (matches only)" : ""}${yearFilter ? ` (year ${yearFilter})` : ""}...`);

  const seasons = (await getTournamentSeasons(WORLD_CUP_TOURNAMENT_ID)) as
    | { id: number; year?: string | number }[]
    | null;
  if (!seasons || seasons.length === 0) {
    log("No SAP seasons found for FIFA World Cup tournament");
    return 0;
  }
  const seasonByYear = new Map<number, number>();
  for (const s of seasons) {
    const year = Number(s.year);
    if (!Number.isNaN(year)) seasonByYear.set(year, s.id);
  }

  const years = Object.keys(PODIUM)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((y) => (yearFilter ? y === yearFilter : true));

  let totalMatches = 0;
  let totalTeams = 0;

  for (const year of years) {
    const worldCupId = await upsertWorldCup(client, year, PODIUM[year]);

    // Reset per-edition match/team rows so the seed stays idempotent
    if (!matchesOnly) {
      await client.execute({
        sql: "DELETE FROM world_cup_teams WHERE world_cup_id = ?",
        args: [worldCupId],
      });
    }
    if (!teamsOnly) {
      await client.execute({
        sql: "DELETE FROM world_cup_matches WHERE world_cup_id = ?",
        args: [worldCupId],
      });
    }

    // Teams (SportsAPI Pro covers every edition)
    const seasonId = seasonByYear.get(year);
    if (!matchesOnly && seasonId) {
      const teamsData = (await getTournamentTeams(WORLD_CUP_TOURNAMENT_ID, seasonId)) as
        | { teams?: { name?: string }[] }
        | null;
      const teams = Array.isArray(teamsData) ? teamsData : (teamsData?.teams || []);
      let count = 0;
      for (const team of teams) {
        if (!team.name) continue;
        await client.execute({
          sql: `INSERT INTO world_cup_teams (world_cup_id, team_name) VALUES (?, ?)`,
          args: [worldCupId, team.name],
        });
        count++;
      }
      totalTeams += count;
      log(`  ${year}: ${count} teams`);
    }

    // Matches
    if (teamsOnly) continue;

    if (year < MANUAL_FROM_YEAR) {
      const manual = MANUAL_MATCHES[year] || [];
      for (const m of manual) {
        await client.execute({
          sql: `INSERT INTO world_cup_matches
                (world_cup_id, stage, group_name, home_team, away_team, home_score, away_score, venue, match_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            worldCupId,
            m.stage,
            m.groupName ?? null,
            m.homeTeam,
            m.awayTeam,
            m.homeScore,
            m.awayScore,
            m.venue ?? null,
            m.matchDate ?? null,
          ],
        });
        totalMatches++;
      }
      log(`  ${year}: ${manual.length} matches (manual)`);
      continue;
    }

    if (!seasonId) {
      log(`  ${year}: SAP season missing, no matches`);
      continue;
    }

    const events = await fetchSeasonEvents(WORLD_CUP_TOURNAMENT_ID, seasonId);
    let count = 0;
    for (const raw of events) {
      const event = raw as {
        id: number;
        startTimestamp?: number;
        status?: { type?: string };
        tournament?: { isGroup?: boolean; groupName?: string | null };
        roundInfo?: { name?: string; slug?: string };
        homeTeam?: { name?: string };
        awayTeam?: { name?: string };
        homeScore?: { display?: number | null };
        awayScore?: { display?: number | null };
        venue?: { name?: string | null };
      };
      if (event.status?.type !== "finished") continue;
      if (!event.homeTeam?.name || !event.awayTeam?.name) continue;

      const matchDate = event.startTimestamp
        ? new Date(event.startTimestamp * 1000).toISOString().split("T")[0]
        : null;

      await client.execute({
        sql: `INSERT INTO world_cup_matches
              (world_cup_id, stage, group_name, home_team, away_team, home_score, away_score, venue, match_date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          worldCupId,
          mapStage(event),
          normalizeGroupName(event.tournament?.groupName),
          event.homeTeam.name,
          event.awayTeam.name,
          toScore(event.homeScore?.display),
          toScore(event.awayScore?.display),
          event.venue?.name ?? null,
          matchDate,
        ],
      });
      count++;
    }
    totalMatches += count;
    log(`  ${year}: ${count} matches (SAP)`);
  }

  log(`Done: ${totalMatches} matches, ${totalTeams} teams across ${years.length} editions`);
  return totalMatches;
}

const isMain =
  process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const args = process.argv.slice(2);
  const yearArg = args.find((a) => a.startsWith("--year="));
  const year = yearArg ? Number(yearArg.split("=")[1]) : undefined;
  const teamsOnly = args.includes("--teams-only");
  const matchesOnly = args.includes("--matches-only");

  const client = getTursoClient();
  runEtl(client, { year, teamsOnly, matchesOnly })
    .then((count) => {
      console.log(`World Cup ETL complete: ${count} matches`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("World Cup ETL failed:", err);
      process.exit(1);
    });
}
