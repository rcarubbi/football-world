import { getTursoClient } from "../../src/lib/turso/client";

let SESSION_COOKIE = "";

export async function fetchSessionCookie(): Promise<string> {
  const username = process.env.THESPORTSDB_USERNAME;
  const password = process.env.THESPORTSDB_PASSWORD;
  if (!username || !password) {
    throw new Error("THESPORTSDB_USERNAME and THESPORTSDB_PASSWORD must be set in .env.local");
  }

  const r = await fetch("https://www.thesportsdb.com/user_login.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    redirect: "manual",
  });

  const setCookie = r.headers.get("set-cookie") || "";
  const m = setCookie.match(/PHPSESSID=([^;]+)/);
  if (!m) throw new Error("Failed to get session cookie from TheSportsDB login");

  SESSION_COOKIE = `PHPSESSID=${m[1]}`;
  console.error(`Session cookie obtained: ${SESSION_COOKIE.substring(0, 30)}...`);
  return SESSION_COOKIE;
}

export const LANG_MAP: Record<string, string> = {
  GB: "EN",
  DE: "DE",
  FR: "FR",
  IT: "IT",
  ES: "ES",
  PT: "PT",
  JP: "JP",
  RU: "RU",
  SE: "SE",
  NL: "NL",
  HU: "HU",
  NO: "NO",
  IL: "IL",
  CN: "CN",
  PL: "PL",
};

export async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; TheSportsDB-Scraper/1.0)",
      "Cookie": SESSION_COOKIE,
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  return r.text();
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\r?\n/g, "\n")
    .trim();
}

export function extractBetween(
  html: string,
  after: string,
  before: string
): string {
  const i = html.indexOf(after);
  if (i === -1) return "";
  const start = i + after.length;
  const j = html.indexOf(before, start);
  if (j === -1) return html.substring(start).trim();
  return html.substring(start, j).trim();
}

export function extractField(html: string, label: string): string {
  const patterns = [
    `<b>${label}</b><br>`,
    `<b>${label}</b>\n`,
    `<b>${label}</b> `,
  ];
  for (const pat of patterns) {
    const i = html.indexOf(pat);
    if (i === -1) continue;
    const rest = html.substring(i + pat.length);
    const nextLabel = rest.indexOf("<b>");
    const content =
      nextLabel !== -1 ? rest.substring(0, nextLabel) : rest.substring(0, 1000);
    return stripTags(content).trim();
  }
  const anchorPat = `<b>${label}</b><a`;
  const ai = html.indexOf(anchorPat);
  if (ai !== -1) {
    const afterA = html.substring(ai + anchorPat.length);
    const closeA = afterA.indexOf("</a>");
    if (closeA !== -1) {
      const afterClose = afterA.substring(closeA + 4);
      const nextLabel = afterClose.indexOf("<b>");
      const raw =
        nextLabel !== -1
          ? afterClose.substring(0, nextLabel)
          : afterClose.substring(0, 1000);
      return stripTags(raw).replace(/^\s*<br>/, "").trim();
    }
  }
  return "";
}

export function extractDescription(html: string, endMarkers: string[]): string {
  const i = html.indexOf("Description</b>");
  if (i === -1) return "";
  const rest = html.substring(i + "Description</b>".length);
  let endIdx = rest.length;
  for (const m of endMarkers) {
    const j = rest.indexOf(m);
    if (j !== -1 && j < endIdx) endIdx = j;
  }
  return stripTags(rest.substring(0, endIdx)).replace(/\r?\n/g, "\n").trim();
}

export function extractImageUrl(html: string, marker: string): string {
  const i = html.indexOf(marker);
  if (i === -1) return "";
  const before = html.substring(0, i);
  const lastHref = before.lastIndexOf("href='");
  if (lastHref !== -1) {
    const urlStart = lastHref + 6;
    const urlEnd = before.indexOf("'", urlStart);
    if (urlEnd !== -1) {
      const raw = before.substring(urlStart, urlEnd);
      if (!raw.includes("no_fanart")) return raw;
    }
  }
  const lastSrc = before.lastIndexOf("src='");
  if (lastSrc !== -1) {
    const urlStart = lastSrc + 5;
    const urlEnd = before.indexOf("'", urlStart);
    if (urlEnd !== -1) {
      const raw = before.substring(urlStart, urlEnd);
      if (!raw.includes("no_fanart")) return raw;
    }
  }
  return "";
}

export function extractUrlFromSection(
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
        return section.substring(urlStart, urlEnd).trim();
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
        return raw.replace(/\/(medium|small|tiny|large)$/, "");
      }
    }
  }
  return "";
}

export function extractSocialLinks(html: string): Record<string, string> {
  const links: Record<string, string> = {};
  const idx = html.indexOf("Other Links</b>");
  if (idx === -1) return links;
  const section = html.substring(idx, idx + 5000);

  const webM = section.match(
    /<a href=['"]([^'"]*)['"][^>]*><img[^>]*webpage_128/
  );
  if (webM) links.strWebsite = webM[1].replace(/^https?:\/\//, "");
  const fbM = section.match(
    /<a href=['"]([^'"]*)['"][^>]*><img[^>]*facebook_128/
  );
  if (fbM) links.strFacebook = fbM[1].replace(/^https?:\/\//, "");
  const twM = section.match(
    /<a href=['"]([^'"]*)['"][^>]*><img[^>]*twitter_128/
  );
  if (twM) links.strTwitter = twM[1].replace(/^https?:\/\//, "");
  const igM = section.match(
    /<a href=['"]([^'"]*)['"][^>]*><img[^>]*instagram_128/
  );
  if (igM) links.strInstagram = igM[1].replace(/^https?:\/\//, "");
  const ytM = section.match(
    /<a href=['"]([^'"]*)['"][^>]*><img[^>]*youtube_128/
  );
  if (ytM) links.strYoutube = ytM[1].replace(/^https?:\/\//, "");
  return links;
}

export function extractExternalIds(html: string): Record<string, string> {
  const ids: Record<string, string> = {};
  const idx = html.indexOf("Other Links</b>");
  if (idx === -1) return ids;
  const section = html.substring(idx, idx + 5000);

  const espnM = section.match(
    /<a href=['"]([^'"]*espn\.com[^'"]*)['"][^>]*><img[^>]*espn_128/
  );
  if (espnM) {
    const m = espnM[1].match(/\/id\/(\d+)/);
    if (m) ids.idESPN = m[1];
  }
  const wikiM = section.match(
    /<a href=['"]([^'"]*wikidata\.org[^'"]*)['"][^>]*><img[^>]*wikidata_128/
  );
  if (wikiM) {
    const m = wikiM[1].match(/\/wiki\/(Q\d+)/);
    if (m) ids.idWikidata = m[1];
  }
  const tmM = section.match(
    /<a href=['"]([^'"]*transfermarkt\.com[^'"]*)['"][^>]*><img[^>]*Transfermarkt/
  );
  if (tmM) {
    const m = tmM[1].match(/\/spieler\/(\d+)/);
    if (m) ids.idTransferMkt = m[1];
  }
  const googleM = section.match(
    /<a href=['"]([^'"]*google\.com[^'"]*)['"][^>]*><img[^>]*googledata/
  );
  if (googleM) {
    const m = googleM[1].match(/kgmid=([^&']*)/);
    if (m) ids.idGoogle = decodeURIComponent(m[1]);
  }
  return ids;
}

export function extractTeamLink(
  html: string,
  label: string
): { id: string; name: string } {
  const pat = `<b>${label}</b>`;
  const i = html.indexOf(pat);
  if (i === -1) return { id: "", name: "" };
  const rest = html.substring(i, i + 500);
  const m = rest.match(/href='\/team\/(\d+)-[^']*'[^>]*>([^<]+)/);
  if (m) return { id: m[1], name: m[2].trim() };
  return { id: "", name: "" };
}

export function extractLeagueLink(html: string): {
  id: string;
  name: string;
} {
  const i = html.indexOf("<b>League</b>");
  if (i === -1) return { id: "", name: "" };
  const rest = html.substring(i, i + 500);
  const m = rest.match(/href='\/league\/(\d+)-[^']*'[^>]*>([^<]+)/);
  if (m) return { id: m[1], name: m[2].trim() };
  return { id: "", name: "" };
}

export function extractBirthInfo(html: string): {
  year: string;
  location: string;
} {
  const i = html.indexOf("<b>Born</b>");
  if (i === -1) return { year: "", location: "" };
  const rest = html.substring(i, i + 500);
  const nextB = rest.indexOf("<b>", 10);
  const raw = nextB !== -1 ? rest.substring(0, nextB) : rest.substring(0, 500);
  const yearM = raw.match(/(\d{4})/);
  const year = yearM ? yearM[1] : "";
  const locM = raw.match(/alt='[^']*'\/>\s*(.+)/);
  const location = locM ? stripTags(locM[1]).trim() : "";
  return { year, location };
}

export function extractColours(html: string): Record<string, string> {
  const colours: Record<string, string> = {};
  const idx = html.indexOf("Primary Colours</b>");
  if (idx === -1) return colours;
  const section = html.substring(idx, idx + 1000);
  const regex = /fill='(#[0-9A-Fa-f]{6})'/g;
  let m;
  let i = 1;
  while ((m = regex.exec(section)) !== null && i <= 3) {
    colours[`strColour${i}`] = m[1];
    i++;
  }
  return colours;
}

export function extractCompetitions(html: string) {
  const result = {
    strLeague: "",
    idLeague: "",
    leagues: [] as { name: string; id: string }[],
  };
  const idx = html.indexOf("Competitions</b>");
  if (idx === -1) return result;
  const section = html.substring(idx, idx + 3000);
  const regex = /href='\/league\/(\d+)-[^']*'[^>]*>([^<]+)/g;
  let m;
  let first = true;
  while ((m = regex.exec(section)) !== null) {
    const league = { id: m[1], name: m[2].trim() };
    result.leagues.push(league);
    if (first) {
      result.strLeague = league.name;
      result.idLeague = league.id;
      first = false;
    }
  }
  return result;
}

export function extractAlternateName(html: string): string {
  const scriptMatch = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  if (!scriptMatch) return "";
  try {
    return JSON.parse(scriptMatch[1]).alternateName || "";
  } catch {
    return "";
  }
}

export function extractCapacity(html: string): string {
  const match = html.match(/\(([\d,]+)\s*Capacity\)/);
  return match ? match[1].replace(/,/g, "") : "";
}

export function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

export async function upsertStagingRow(
  table: string,
  columns: string[],
  values: string[]
): Promise<void> {
  const client = getTursoClient();
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
  await client.execute({
    sql,
    args: values,
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
