export function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Generates a SQLite expression that strips accents from a column using REPLACE chains. */
export function sqlStripAccents(col: string): string {
  const pairs: [string, string][] = [
    ["á", "a"], ["à", "a"], ["â", "a"], ["ã", "a"], ["ä", "a"],
    ["é", "e"], ["è", "e"], ["ê", "e"], ["ë", "e"],
    ["í", "i"], ["ì", "i"], ["î", "i"], ["ï", "i"],
    ["ó", "o"], ["ò", "o"], ["ô", "o"], ["õ", "o"], ["ö", "o"],
    ["ú", "u"], ["ù", "u"], ["û", "u"], ["ü", "u"],
    ["ñ", "n"], ["ç", "c"], ["ý", "y"], ["ÿ", "y"],
  ];
  let expr = `LOWER(${col})`;
  for (const [from, to] of pairs) {
    expr = `REPLACE(${expr}, '${from}', '${to}')`;
  }
  return expr;
}

export function stripWikiMarkup(text: string): string {
  return text
    .replace(/\[edit\](?:\([^)]*\))?/gi, "")
    .replace(/\[edit\]/gi, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
