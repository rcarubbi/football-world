export interface WorldCupEdition {
  year: number;
  host: string;
  logoUrl: string;
  mascot: {
    name: string;
    description: string;
    imageUrl?: string;
  } | null;
}

export const WORLD_CUP_EDITIONS: Record<number, WorldCupEdition> = {
  1930: { year: 1930, host: "Uruguay", logoUrl: "/images/world-cup/logos/1930.png", mascot: null },
  1934: { year: 1934, host: "Italy", logoUrl: "/images/world-cup/logos/1934.png", mascot: null },
  1938: { year: 1938, host: "France", logoUrl: "/images/world-cup/logos/1938.png", mascot: null },
  1950: { year: 1950, host: "Brazil", logoUrl: "/images/world-cup/logos/1950.png", mascot: null },
  1954: { year: 1954, host: "Switzerland", logoUrl: "/images/world-cup/logos/1954.png", mascot: null },
  1958: { year: 1958, host: "Sweden", logoUrl: "/images/world-cup/logos/1958.png", mascot: null },
  1962: { year: 1962, host: "Chile", logoUrl: "/images/world-cup/logos/1962.png", mascot: null },
  1966: {
    year: 1966, host: "England", logoUrl: "/images/world-cup/logos/1966.png",
    mascot: { name: "World Cup Willie", description: "An anthropomorphic lion wearing a Union Jack jersey — the first-ever World Cup mascot.", imageUrl: "/images/world-cup/mascots/1966.png" },
  },
  1970: {
    year: 1970, host: "Mexico", logoUrl: "/images/world-cup/logos/1970.png",
    mascot: { name: "Juanito", description: "A boy wearing Mexico's kit and a sombrero with 'MEXICO 70' on it.", imageUrl: "/images/world-cup/mascots/1970.png" },
  },
  1974: {
    year: 1974, host: "West Germany", logoUrl: "/images/world-cup/logos/1974.png",
    mascot: { name: "Tip and Tap", description: "Two boys wearing Germany's kits with 'WM 74' on them.", imageUrl: "/images/world-cup/mascots/1974.png" },
  },
  1978: {
    year: 1978, host: "Argentina", logoUrl: "/images/world-cup/logos/1978.png",
    mascot: { name: "Gauchito", description: "A boy wearing Argentina's kit with a hat, neckerchief and whip typical of gauchos.", imageUrl: "/images/world-cup/mascots/1978.png" },
  },
  1982: {
    year: 1982, host: "Spain", logoUrl: "/images/world-cup/logos/1982.png",
    mascot: { name: "Naranjito", description: "An anthropomorphic orange wearing Spain's national team kit.", imageUrl: "/images/world-cup/mascots/1982.png" },
  },
  1986: {
    year: 1986, host: "Mexico", logoUrl: "/images/world-cup/logos/1986.png",
    mascot: { name: "Pique", description: "An anthropomorphic jalapeño pepper with a moustache and sombrero.", imageUrl: "/images/world-cup/mascots/1986.png" },
  },
  1990: {
    year: 1990, host: "Italy", logoUrl: "/images/world-cup/logos/1990.png",
    mascot: { name: "Ciao", description: "A stick figure player with a football head and Italian tricolore body.", imageUrl: "/images/world-cup/mascots/1990.png" },
  },
  1994: {
    year: 1994, host: "United States", logoUrl: "/images/world-cup/logos/1994.png",
    mascot: { name: "Striker", description: "An anthropomorphic dog wearing a red, white, and blue soccer uniform.", imageUrl: "/images/world-cup/mascots/1994.png" },
  },
  1998: {
    year: 1998, host: "France", logoUrl: "/images/world-cup/logos/1998.png",
    mascot: { name: "Footix", description: "An anthropomorphic cockerel, a national symbol of France, with 'FRANCE 98' on his chest.", imageUrl: "/images/world-cup/mascots/1998.png" },
  },
  2002: {
    year: 2002, host: "South Korea / Japan", logoUrl: "/images/world-cup/logos/2002.png",
    mascot: { name: "Ato, Kaz and Nik", description: "Three futuristic 'Atmosball' creatures — Ato the coach, Kaz and Nik the players.", imageUrl: "/images/world-cup/mascots/2002.png" },
  },
  2006: {
    year: 2006, host: "Germany", logoUrl: "/images/world-cup/logos/2006.png",
    mascot: { name: "Goleo VI & Pille", description: "An anthropomorphic lion wearing a Germany shirt with a talking football named Pille.", imageUrl: "/images/world-cup/mascots/2006.png" },
  },
  2010: {
    year: 2010, host: "South Africa", logoUrl: "/images/world-cup/logos/2010.png",
    mascot: { name: "Zakumi", description: "An anthropomorphic leopard with green hair, representing South African sports colors.", imageUrl: "/images/world-cup/mascots/2010.png" },
  },
  2014: {
    year: 2014, host: "Brazil", logoUrl: "/images/world-cup/logos/2014.png",
    mascot: { name: "Fuleco", description: "An anthropomorphic Brazilian three-banded armadillo, a vulnerable species endemic to Brazil.", imageUrl: "/images/world-cup/mascots/2014.png" },
  },
  2018: {
    year: 2018, host: "Russia", logoUrl: "/images/world-cup/logos/2018.png",
    mascot: { name: "Zabivaka", description: "An anthropomorphic wolf whose name means 'The Goalscorer' in Russian.", imageUrl: "/images/world-cup/mascots/2018.png" },
  },
  2022: {
    year: 2022, host: "Qatar", logoUrl: "/images/world-cup/logos/2022.png",
    mascot: { name: "La'eeb", description: "A white floating anthropomorphic ghutrah meaning 'super-skilled player' in Arabic.", imageUrl: "/images/world-cup/mascots/2022.png" },
  },
  2026: {
    year: 2026, host: "USA / Canada / Mexico", logoUrl: "/images/world-cup/logos/2026.png",
    mascot: { name: "Maple, Zayu & Clutch", description: "Maple the Moose (Canada), Zayu the Jaguar (Mexico), and Clutch the Bald Eagle (USA).", imageUrl: "/images/world-cup/mascots/2026.png" },
  },
};

export function getWorldCupEdition(year: number): WorldCupEdition | undefined {
  return WORLD_CUP_EDITIONS[year];
}
