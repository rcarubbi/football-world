export const WIKI_SELECTORS = {
  // Main content selectors
  content: "#mw-content-text .mw-parser-output",
  historySection: "#History, #Club_history, #Historie",
  stadiumSection: "#Stadium, #Ground, #Stadien",

  // Info box selectors
  infoBox: ".infobox, .infobox_v2",
  infoBoxRow: ".infobox tr",
  infoBoxLabel: ".infobox-label, .infobox-header",
  infoBoxData: ".infobox-data, .infobox-cell-data",

  // Content cleaning selectors to remove
  removeSelectors: [
    ".reflist",
    ".references",
    ".navbox",
    ".sistersitebox",
    ".ambox",
    ".mbox-small",
    ".noprint",
    ".mw-empty-elt",
    ".mw-editsection",
    ".toc",
    ".toccolours",
    "#toc",
    ".reference",
    ".reflist",
    ".navbox",
    ".sistersitebox",
    ".ambox",
    ".mbox-small",
    ".noprint",
    ".mw-empty-elt",
    ".mw-editsection",
    ".toc",
    ".toccolours",
    "#toc",
  ],

  // Disambiguation selectors
  disambiguation: ".mw-disambiguation, .dablink",
  disambiguationLinks: ".mw-disambiguation a",

  // External links
  externalLinks: ".external",
};
