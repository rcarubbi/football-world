const COUNTRY_TO_CODE: Record<string, string> = {
  "argentina": "ar", "australia": "au", "austria": "at", "belgium": "be",
  "brazil": "br", "brasil": "br", "cameroon": "cm", "canada": "ca",
  "croatia": "hr", "denmark": "dk", "ecuador": "ec", "england": "gb-eng",
  "france": "fr", "germany": "de", "ghana": "gh", "iran": "ir",
  "japan": "jp", "mexico": "mx", "morocco": "ma", "netherlands": "nl",
  "poland": "pl", "portugal": "pt", "qatar": "qa", "saudi arabia": "sa",
  "senegal": "sn", "serbia": "rs", "south korea": "kr", "korea": "kr",
  "spain": "es", "switzerland": "ch", "tunisia": "tn", "uruguay": "uy",
  "usa": "us", "united states": "us", "wales": "gb-wls", "italy": "it",
  "scotland": "gb-sct", "norway": "no", "sweden": "se", "turkey": "tr",
  "ukraine": "ua", "czech republic": "cz", "czechia": "cz",
  "nigeria": "ng", "algeria": "dz", "egypt": "eg", "south africa": "za",
  "china": "cn", "india": "in", "russia": "ru", "ireland": "ie",
  "colombia": "co", "chile": "cl", "peru": "pe", "paraguay": "py",
  "venezuela": "ve", "bolivia": "bo", "panama": "pa", "costa rica": "cr",
  "honduras": "hn", "jamaica": "jm", "trinidad": "tt", "curaçao": "cw",
  "curacao": "cw", "greece": "gr", "romania": "ro", "hungary": "hu",
  "iceland": "is", "finland": "fi", "czech": "cz", "slovakia": "sk",
  "slovenia": "si", "bulgaria": "bg", "albania": "al", "north macedonia": "mk",
  "kosovo": "xk", "montenegro": "me", "bosnia": "ba", "georgia": "ge",
  "armenia": "am", "azerbaijan": "az", "kazakhstan": "kz", "uzbekistan": "uz",
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
