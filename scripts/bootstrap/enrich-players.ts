import { getTursoClient } from "../../src/lib/turso/client";

interface WikiSummary {
  extract?: string;
  title?: string;
}

async function fetchWikipediaSummary(playerName: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(playerName)}`;
    const response = await fetch(searchUrl, {
      headers: { "User-Agent": "FootballWiki/1.0 (https://football-world.vercel.app)" },
    });

    if (!response.ok) {
      const searchApiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(playerName + " footballer")}&format=json`;
      const searchResponse = await fetch(searchApiUrl, {
        headers: { "User-Agent": "FootballWiki/1.0 (https://football-world.vercel.app)" },
      });

      if (!searchResponse.ok) return null;

      const searchData = await searchResponse.json();
      const results = searchData?.query?.search;

      if (!results || results.length === 0) return null;

      const topResult = results[0].title;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult)}`;
      const summaryResponse = await fetch(summaryUrl, {
        headers: { "User-Agent": "FootballWiki/1.0 (https://football-world.vercel.app)" },
      });

      if (!summaryResponse.ok) return null;

      const data: WikiSummary = await summaryResponse.json();
      return data.extract || null;
    }

    const data: WikiSummary = await response.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

export async function enrichPlayers(): Promise<void> {
  const client = getTursoClient();

  console.log("  Finding top players for Wikipedia enrichment...");

  const playersResult = await client.execute(`
    SELECT p.id, p.name, p.career_summary
    FROM players p
    WHERE p.career_summary IS NULL
    LIMIT 50
  `);

  const players = playersResult.rows.map((row) => ({
    id: row.id as number,
    name: row.name as string,
    career_summary: row.career_summary as string | null,
  }));

  console.log(`  Found ${players.length} players without career summaries`);

  let enriched = 0;
  for (const player of players) {
    const summary = await fetchWikipediaSummary(player.name);

    if (summary) {
      await client.execute({
        sql: "UPDATE players SET career_summary = ? WHERE id = ?",
        args: [summary, player.id],
      });
      enriched++;
      console.log(`    Enriched: ${player.name}`);
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`  Enriched ${enriched} of ${players.length} players`);
}
