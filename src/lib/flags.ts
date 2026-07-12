const COUNTRY_TO_CODE: Record<string, string> = {
  "argentina": "ar", "australia": "au", "austria": "at", "belgium": "be",
  "bosnia-herzegovina": "ba", "bosnia": "ba",
  "brazil": "br", "brasil": "br", "cameroon": "cm", "canada": "ca",
  "cape verde": "cv", "cape verde islands": "cv",
  "colombia": "co", "congo dr": "cd", "dr congo": "cd",
  "croatia": "hr", "curacao": "cw", "curaçao": "cw",
  "czechia": "cz", "czech republic": "cz", "czech": "cz",
  "denmark": "dk", "ecuador": "ec", "egypt": "eg",
  "england": "gb-eng", "france": "fr", "germany": "de", "ghana": "gh",
  "haiti": "ht", "iran": "ir", "iraq": "iq",
  "ireland": "ie", "italy": "it", "ivory coast": "ci", "cote d'ivoire": "ci",
  "japan": "jp", "jordan": "jo",
  "kazakhstan": "kz", "kosovo": "xk",
  "mexico": "mx", "montenegro": "me", "morocco": "ma",
  "netherlands": "nl", "new zealand": "nz", "north macedonia": "mk",
  "norway": "no", "nigeria": "ng", "algeria": "dz",
  "panama": "pa", "paraguay": "py", "peru": "pe",
  "poland": "pl", "portugal": "pt",
  "qatar": "qa",
  "romania": "ro", "russia": "ru",
  "saudi arabia": "sa", "scotland": "gb-sct", "senegal": "sn",
  "serbia": "rs", "slovakia": "sk", "slovenia": "si",
  "south africa": "za", "south korea": "kr", "korea": "kr",
  "spain": "es", "sweden": "se", "switzerland": "ch",
  "trinidad": "tt", "tunisia": "tn", "turkey": "tr",
  "ukraine": "ua", "united states": "us", "usa": "us",
  "uruguay": "uy", "uzbekistan": "uz",
  "venezuela": "ve", "wales": "gb-wls",
  "china": "cn", "india": "in",
  "bulgaria": "bg", "hungary": "hu", "greece": "gr",
  "finland": "fi", "iceland": "is", "cyprus": "cy",
  "georgia": "ge", "armenia": "am", "azerbaijan": "az",
  "albania": "al", "honduras": "hn",
  "jamaica": "jm", "bolivia": "bo", "chile": "cl",
};

export function getCountryCode(nationality: string): string | null {
  const lower = nationality.toLowerCase().trim();
  if (COUNTRY_TO_CODE[lower]) return COUNTRY_TO_CODE[lower];
  for (const [key, code] of Object.entries(COUNTRY_TO_CODE)) {
    if (lower.includes(key) || key.includes(lower)) return code;
  }
  return null;
}

export function getFlagUrl(nationality: string): string | null {
  const code = getCountryCode(nationality);
  if (!code) return null;
  return `https://flagcdn.com/w80/${code}.png`;
}
