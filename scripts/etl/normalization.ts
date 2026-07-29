const DIACRITICS: Record<string, string> = {
  a: "áàâãäå", A: "ÁÀÂÃÄÅ",
  e: "éèêë", E: "ÉÈÊË",
  i: "íìîï", I: "ÍÌÎÏ",
  o: "óòôõöø", O: "ÓÒÔÕÖØ",
  u: "úùûü", U: "ÚÙÛÜ",
  c: "ç", C: "Ç",
  n: "ñ", N: "Ñ",
  y: "ýÿ", Y: "ÝŸ",
  ae: "æ", AE: "Æ",
  th: "þ", TH: "Þ",
  d: "ð", D: "Ð",
};

function removeDiacritics(str: string): string {
  let result = str;
  for (const [base, chars] of Object.entries(DIACRITICS)) {
    for (const ch of chars) {
      result = result.replaceAll(ch, base);
    }
  }
  return result;
}

export function normalizeName(str: string): string {
  return removeDiacritics(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const TEAM_ALIASES: Record<string, string> = {
  "man utd": "manchester united",
  "man united": "manchester united",
  "man u": "manchester united",
  "man city": "manchester city",
  "spurs": "tottenham hotspur",
  "tottenham": "tottenham hotspur",
  "newcastle": "newcastle united",
  "nottm forest": "nottingham forest",
  "forest": "nottingham forest",
  "brighton": "brighton and hove albion",
  "wolves": "wolverhampton wanderers",
  "wolverhampton": "wolverhampton wanderers",
  "west ham": "west ham united",
  "aston villa": "aston villa",
  "crystal palace": "crystal palace",
  "leeds": "leeds united",
  "sheffield utd": "sheffield united",
  "burnley": "burnley",
  "luton": "luton town",
  "ipswich": "ipswich town",
  "bournemouth": "afc bournemouth",
};

export function normalizeTeamName(str: string): string {
  const norm = normalizeName(str);
  return TEAM_ALIASES[norm] || norm;
}

export function normalizeLeagueSlug(str: string): string {
  return normalizeName(str)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const LEAGUE_ALIASES: Record<string, string> = {
  "english premier league": "premier-league",
  "premier league": "premier-league",
  "la liga": "la-liga",
  "laliga": "la-liga",
  "bundesliga": "bundesliga",
  "serie a": "serie-a",
  "ligue 1": "ligue-1",
  "ligue 1 Uber Eats": "ligue-1",
  "eredivisie": "eredivisie",
  "primeira liga": "primeira-liga",
  "championship": "championship",
  "championship league": "championship",
};

export function resolveLeagueSlug(name: string): string {
  const norm = normalizeName(name);
  return LEAGUE_ALIASES[norm] || normalizeLeagueSlug(name);
}

export function toInt(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

export function toStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s || null;
}
