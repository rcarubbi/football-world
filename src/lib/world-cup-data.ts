export interface WorldCupEdition {
  year: number;
  host: string;
  logoUrl: string;
  mascot: {
    name: string;
    description: string;
    imageUrl: string;
  } | null;
}

export const WORLD_CUP_EDITIONS: Record<number, WorldCupEdition> = {
  1930: {
    year: 1930,
    host: "Uruguay",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/7/79/1930_FIFA_World_Cup.svg/1200px-1930_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1934: {
    year: 1934,
    host: "Italy",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3e/1934_FIFA_World_Cup.svg/1200px-1934_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1938: {
    year: 1938,
    host: "France",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/1938_FIFA_World_Cup.svg/1200px-1938_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1950: {
    year: 1950,
    host: "Brazil",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/0/07/1950_FIFA_World_Cup.svg/1200px-1950_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1954: {
    year: 1954,
    host: "Switzerland",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/1954_FIFA_World_Cup.svg/1200px-1954_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1958: {
    year: 1958,
    host: "Sweden",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/1958_FIFA_World_Cup.svg/1200px-1958_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1962: {
    year: 1962,
    host: "Chile",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/1962_FIFA_World_Cup.svg/1200px-1962_FIFA_World_Cup.svg.png",
    mascot: null,
  },
  1966: {
    year: 1966,
    host: "England",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/1966_FIFA_World_Cup.svg/1200px-1966_FIFA_World_Cup.svg.png",
    mascot: {
      name: "World Cup Willie",
      description: "An anthropomorphic lion wearing a Union Jack jersey, the first-ever World Cup mascot.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4e/World_Cup_Willie.png",
    },
  },
  1970: {
    year: 1970,
    host: "Mexico",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b5/1970_FIFA_World_Cup.svg/1200px-1970_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Juanito",
      description: "A boy wearing Mexico's kit and a sombrero with 'MEXICO 70' on it.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/1/12/Juanito_1970.png",
    },
  },
  1974: {
    year: 1974,
    host: "West Germany",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/1974_FIFA_World_Cup.svg/1200px-1974_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Tip and Tap",
      description: "Two boys wearing Germany's kits with 'WM 74' on them.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9a/Tip_and_Tap_1974.png",
    },
  },
  1978: {
    year: 1978,
    host: "Argentina",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/1978_FIFA_World_Cup.svg/1200px-1978_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Gauchito",
      description: "A boy wearing Argentina's kit with a hat, neckerchief and whip typical of gauchos.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/c/c4/Gauchito.png",
    },
  },
  1982: {
    year: 1982,
    host: "Spain",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/33/1982_FIFA_World_Cup.svg/1200px-1982_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Naranjito",
      description: "An anthropomorphic orange wearing Spain's national team kit.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/6/63/Naranjito.png",
    },
  },
  1986: {
    year: 1986,
    host: "Mexico",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e9/1986_FIFA_World_Cup.svg/1200px-1986_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Pique",
      description: "An anthropomorphic jalapeño pepper with a moustache and sombrero.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/f/f4/Pique_1986.png",
    },
  },
  1990: {
    year: 1990,
    host: "Italy",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/1990_FIFA_World_Cup.svg/1200px-1990_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Ciao",
      description: "A stick figure player with a football head and Italian tricolore body.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/7/77/Ciao_%28mascot%29.png",
    },
  },
  1994: {
    year: 1994,
    host: "United States",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/1994_FIFA_World_Cup.svg/1200px-1994_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Striker",
      description: "An anthropomorphic dog wearing a red, white, and blue soccer uniform.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d8/Striker_%28mascot%29.png",
    },
  },
  1998: {
    year: 1998,
    host: "France",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/1998_FIFA_World_Cup.svg/1200px-1998_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Footix",
      description: "An anthropomorphic cockerel, a national symbol of France, with 'FRANCE 98' on his chest.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/2/2e/Footix.png",
    },
  },
  2002: {
    year: 2002,
    host: "South Korea / Japan",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/2002_FIFA_World_Cup.svg/1200px-2002_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Ato, Kaz and Nik",
      description: "Three futuristic 'Atmosball' creatures — Ato the coach, Kaz and Nik the players.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/b/b9/2002_FIFA_World_Cup_mascots.png",
    },
  },
  2006: {
    year: 2006,
    host: "Germany",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/37/2006_FIFA_World_Cup.svg/1200px-2006_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Goleo VI & Pille",
      description: "An anthropomorphic lion wearing a Germany shirt with a talking football named Pille.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/d/d3/Goleo_and_Pille.png",
    },
  },
  2010: {
    year: 2010,
    host: "South Africa",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/2/27/2010_FIFA_World_Cup.svg/1200px-2010_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Zakumi",
      description: "An anthropomorphic leopard with green hair, representing South African sports colors.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/33/Zakumi.png",
    },
  },
  2014: {
    year: 2014,
    host: "Brazil",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/2014_FIFA_World_Cup.svg/1200px-2014_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Fuleco",
      description: "An anthropomorphic Brazilian three-banded armadillo, a vulnerable species endemic to Brazil.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4a/Fuleco_the_Armadillo.png",
    },
  },
  2018: {
    year: 2018,
    host: "Russia",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3a/2018_FIFA_World_Cup.svg/1200px-2018_FIFA_World_Cup.svg.png",
    mascot: {
      name: "Zabivaka",
      description: "An anthropomorphic wolf whose name means 'The Goalscorer' in Russian.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/8/8b/Zabivaka.png",
    },
  },
  2022: {
    year: 2022,
    host: "Qatar",
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/2022_FIFA_World_Cup.svg/1200px-2022_FIFA_World_Cup.svg.png",
    mascot: {
      name: "La'eeb",
      description: "A white floating anthropomorphic ghutrah meaning 'super-skilled player' in Arabic.",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/4c/La%27eeb.png",
    },
  },
  2026: {
    year: 2026,
    host: "USA / Canada / Mexico",
    logoUrl: "https://crests.football-data.org/wm26.png",
    mascot: {
      name: "Maple, Zayu & Clutch",
      description: "Maple the Moose (Canada), Zayu the Jaguar (Mexico), and Clutch the Bald Eagle (USA).",
      imageUrl: "https://upload.wikimedia.org/wikipedia/en/4/48/2026_FIFA_World_Cup_mascots.png",
    },
  },
};

export function getWorldCupEdition(year: number): WorldCupEdition | undefined {
  return WORLD_CUP_EDITIONS[year];
}
