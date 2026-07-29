import * as cheerio from "cheerio";
import {
  fetchHtml,
  stripTags,
  extractField,
  extractDescription,
  extractSocialLinks,
  upsertStagingRow,
  sleep,
  LANG_MAP,
} from "./scrape-helpers";

interface LeagueData {
  [key: string]: string;
}

function extractFanartUrls(html: string): string[] {
  const urls: string[] = [];
  const regex =
    /href='(https:\/\/r2\.thesportsdb\.com\/images\/media\/league\/fanart\/[^']+)'/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const url = m[1].replace(/\/(small|medium|large)$/, "");
    if (!url.includes("no_fanart") && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

function extractTvRights(html: string): string {
  const i = html.indexOf("<b>TV Rights</b><br>");
  if (i === -1) return "";
  const rest = html.substring(i + "<b>TV Rights</b><br>".length);
  const nextLabel = rest.indexOf("<b>");
  const content =
    nextLabel !== -1 ? rest.substring(0, nextLabel) : rest.substring(0, 2000);
  return stripTags(content).replace(/\r?\n/g, "\n").trim();
}

function extractCurrentSeason(html: string): string {
  const i = html.indexOf("<b>Current Season</b><br>");
  if (i === -1) return "";
  const rest = html.substring(i + "<b>Current Season</b><br>".length);
  const aM = rest.match(/<a[^>]*>([^<]+)<\/a>/);
  return aM ? aM[1].trim() : stripTags(rest.substring(0, 100)).trim();
}

function scrapeLeaguePage(html: string, leagueId: string): LeagueData {
  const data: LeagueData = {};
  data.idLeague = leagueId;

  const $ = cheerio.load(html);
  const h1 = $("h1").first();
  const nameLink = h1.find("a").first();
  data.strLeague = nameLink.text().trim() || h1.text().trim();

  const badgeAnchor = $("a[href*='/badge/'][rel='prettyPhoto']").first();
  data.strBadge = (badgeAnchor.attr("href") || "").replace(
    /\/(medium|large|tiny)$/,
    ""
  );

  const posterAnchor = $("a[href*='/poster/'][rel='prettyPhoto']").first();
  data.strPoster = (posterAnchor.attr("href") || "").replace(
    /\/(medium|large|tiny)$/,
    ""
  );

  const logoAnchor = $("a[href*='/logo/'][rel='prettyPhoto']").first();
  data.strLogo = (logoAnchor.attr("href") || "").replace(
    /\/(medium|large|tiny)$/,
    ""
  );

  const bannerAnchor = $("a[href*='/banner/'][rel='prettyPhoto']").first();
  data.strBanner = (bannerAnchor.attr("href") || "").replace(
    /\/(medium|large|tiny)$/,
    ""
  );

  const trophyImg = $('img[src*="/trophy/"]').first();
  data.strTrophy = (trophyImg.attr("src") || "").replace(
    /\/(medium|large|tiny)$/,
    ""
  );

  data.intFormedYear =
    extractField(html, "Established").match(/(\d{4})/)?.[1] || "";
  data.dateFirstEvent = extractField(html, "First Recorded Event");
  data.strCurrentSeason = extractCurrentSeason(html);
  data.strSport = extractField(html, "Sport");
  data.strCountry = extractField(html, "Location");
  data.strGender = extractField(html, "Gender");
  data.strTvRights = extractTvRights(html);
  data.strDescriptionEN = extractDescription(html, [
    "<br><a href='https://en.wikipedia.org",
    "<br><a href='https://www.google",
    "<b>Seasons</b>",
    "<b id='allseasons'>",
  ]);

  const social = extractSocialLinks(html);
  Object.assign(data, social);

  const fanarts = extractFanartUrls(html);
  data.strFanart1 = fanarts[0] || "";
  data.strFanart2 = fanarts[1] || "";
  data.strFanart3 = fanarts[2] || "";
  data.strFanart4 = fanarts[3] || "";

  return data;
}

async function scrapeLanguageDescription(
  slug: string,
  lanCode: string
): Promise<{ field: string; value: string }> {
  const url = `https://www.thesportsdb.com/league/${slug}?lan=${lanCode}`;
  const html = await fetchHtml(url);
  const desc = extractDescription(html, [
    "<br><a href='https://en.wikipedia.org",
    "<br><a href='https://www.google",
    "<b>Seasons</b>",
    "<b id='allseasons'>",
  ]);
  const fieldKey = `strDescription${LANG_MAP[lanCode]}`;
  return { field: fieldKey, value: desc };
}

export async function scrapeLeague(
  slug: string,
  leagueId: string
): Promise<{ slug: string; ok: boolean; error?: string }> {
  console.error(`[${slug}] Scraping...`);

  const mainHtml = await fetchHtml(
    `https://www.thesportsdb.com/league/${slug}`
  );
  const data = scrapeLeaguePage(mainHtml, leagueId);

  console.error(`[${slug}] Fetching descriptions...`);
  const langEntries = Object.entries(LANG_MAP).filter(([k]) => k !== "GB");
  for (const [lanCode] of langEntries) {
    try {
      const { field, value } = await scrapeLanguageDescription(slug, lanCode);
      if (value) data[field] = value;
    } catch (e: any) {
      console.error(`[${slug}] ${lanCode}: ${e.message}`);
    }
    await sleep(200);
  }

  console.error(`[${slug}] Upserting...`);
  const now = new Date().toISOString();
  await upsertStagingRow(
    "tsdb_leagues",
    ["tsdb_id", "name", "sport", "country", "badge_url", "formed_year", "gender", "description", "raw_json", "fetched_at"],
    [
      data.idLeague || "",
      data.strLeague || "",
      data.strSport || "",
      data.strCountry || "",
      data.strBadge || "",
      data.intFormedYear || "",
      data.strGender || "",
      data.strDescriptionEN || "",
      JSON.stringify(data),
      now,
    ]
  );

  console.error(`[${slug}] Done.`);
  return { slug, ok: true };
}
