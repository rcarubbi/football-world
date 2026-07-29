import * as cheerio from "cheerio";
import {
  fetchHtml,
  extractField,
  extractDescription,
  extractSocialLinks,
  extractTeamLink,
  extractCompetitions,
  extractAlternateName,
  extractCapacity,
  extractColours,
  upsertStagingRow,
  sleep,
  LANG_MAP,
} from "./scrape-helpers";

interface TeamData {
  [key: string]: string;
}

function extractImageUrlTeam(
  html: string,
  sectionLabel: string,
  marker: string
): string {
  const secIdx = html.indexOf(`<b>${sectionLabel}</b>`);
  if (secIdx === -1) return "";
  const section = html.substring(secIdx, secIdx + 3000);
  const mIdx = section.indexOf(marker);
  if (mIdx === -1) return "";
  const before = section.substring(0, mIdx);
  for (const quote of ["'", '"']) {
    const lastHref = before.lastIndexOf(`href=${quote}`);
    if (lastHref !== -1) {
      const urlStart = lastHref + 6;
      const urlEnd = section.indexOf(quote, urlStart);
      if (urlEnd !== -1) {
        const raw = section.substring(urlStart, urlEnd).trim();
        if (!raw.includes("no_"))
          return raw.replace(/\/(medium|large|tiny)$/, "");
      }
    }
  }
  for (const quote of ["'", '"']) {
    const lastSrc = before.lastIndexOf(`src=${quote}`);
    if (lastSrc !== -1) {
      const urlStart = lastSrc + 5;
      const urlEnd = section.indexOf(quote, urlStart);
      if (urlEnd !== -1) {
        const raw = section.substring(urlStart, urlEnd).trim();
        if (!raw.includes("no_"))
          return raw.replace(/\/(medium|large|tiny)$/, "");
      }
    }
  }
  return "";
}

function scrapeTeamPage(html: string, teamId: string): TeamData {
  const data: TeamData = {};
  data.idTeam = teamId;

  const $ = cheerio.load(html);
  const h1 = $("h1").first();
  data.strTeam = h1.find("a").first().text().trim() || h1.text().trim();
  data.strTeamAlternate = extractAlternateName(html);

  const leagues = extractCompetitions(html);
  data.strLeague = leagues.strLeague;
  data.idLeague = leagues.idLeague;
  for (let i = 1; i < leagues.leagues.length && i <= 7; i++) {
    data[`strLeague${i + 1}`] = leagues.leagues[i].name;
    data[`idLeague${i + 1}`] = leagues.leagues[i].id;
  }

  data.intFormedYear =
    extractField(html, "Established").match(/(\d{4})/)?.[1] || "";
  data.strSport = extractField(html, "Sport");
  const rawVenue = extractField(html, "Venue");
  data.strStadium = rawVenue
    .replace(/\s*\([\d,]+\s*Capacity\)/, "")
    .trim();
  data.intStadiumCapacity = extractCapacity(html);
  data.strLocation = extractField(html, "Location");
  data.strKeywords = extractField(html, "Nicknames");
  data.strCountry = data.strLocation.split(",").pop()?.trim() || "";

  data.strBadge = extractImageUrlTeam(html, "Badge", "badge/");
  data.strLogo = extractImageUrlTeam(html, "Logo", "logo/");
  data.strBanner = extractImageUrlTeam(html, "Banner", "banner/");
  data.strEquipment = extractImageUrlTeam(
    html,
    "Equipment Clearart",
    "equipment/"
  );

  const team = extractTeamLink(html, "Team");
  if (team.id) data.idTeamFromPage = team.id;

  Object.assign(data, extractSocialLinks(html));
  Object.assign(data, extractColours(html));

  data.strDescriptionEN = extractDescription(html, [
    "<br><a href='https://en.wikipedia.org",
    "<br><a href='https://www.google",
    "<b id='playerImages'",
    "<b>Team Members</b>",
  ]);

  return data;
}

async function scrapeLanguageDescription(
  teamUrl: string,
  lanCode: string
): Promise<{ field: string; value: string }> {
  const html = await fetchHtml(`${teamUrl}?lan=${lanCode}`);
  return {
    field: `strDescription${LANG_MAP[lanCode]}`,
    value: extractDescription(html, [
      "<br><a href='https://en.wikipedia.org",
      "<br><a href='https://www.google",
      "<b id='playerImages'",
      "<b>Team Members</b>",
    ]),
  };
}

export async function getTeamLinks(leagueSlug: string): Promise<string[]> {
  const html = await fetchHtml(
    `https://www.thesportsdb.com/league/${leagueSlug}`
  );
  const regex = /\/team\/(\d+-[a-z0-9-]+)/g;
  const slugs: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (!slugs.includes(m[1])) slugs.push(m[1]);
  }
  return slugs;
}

export async function scrapeTeam(
  teamSlug: string
): Promise<{ slug: string; ok: boolean; data?: TeamData; error?: string }> {
  const teamUrl = `https://www.thesportsdb.com/team/${teamSlug}`;
  const m = teamSlug.match(/^(\d+)/);
  if (!m) return { slug: teamSlug, ok: false, error: "Invalid slug" };
  const teamId = m[1];

  console.error(`  [${teamSlug}] Fetching...`);
  const html = await fetchHtml(teamUrl);
  const data = scrapeTeamPage(html, teamId);

  for (const [lanCode] of Object.entries(LANG_MAP).filter(
    ([k]) => k !== "GB"
  )) {
    try {
      const { field, value } = await scrapeLanguageDescription(teamUrl, lanCode);
      if (value && !value.startsWith("---")) data[field] = value;
    } catch {
      // skip failed language
    }
    await sleep(200);
  }

  return { slug: teamSlug, ok: true, data };
}

export async function upsertTeamToStaging(team: TeamData): Promise<void> {
  const now = new Date().toISOString();
  await upsertStagingRow(
    "tsdb_teams",
    [
      "tsdb_id",
      "league_tsdb_id",
      "name",
      "short_name",
      "badge_url",
      "kit_home_url",
      "kit_away_url",
      "kit_third_url",
      "founded",
      "stadium",
      "location",
      "description",
      "website",
      "raw_json",
      "fetched_at",
    ],
    [
      team.idTeam || team.idTeamFromPage || "",
      team.idLeague || "",
      team.strTeam || "",
      team.strTeamShort || "",
      team.strBadge || "",
      team.strEquipment || "",
      "",
      "",
      team.intFormedYear || "",
      team.strStadium || "",
      team.strLocation || "",
      team.strDescriptionEN || "",
      team.strWebsite || "",
      JSON.stringify(team),
      now,
    ]
  );
}
