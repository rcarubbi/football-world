import { getTursoClient } from "../../src/lib/turso/client";
import { getAllAreas } from "../../src/lib/api/football-data";

interface FdArea {
  id: number;
  name: string;
  code: string;
  flag: string | null;
  parentAreaId: number | null;
}

export async function fetchAreas(): Promise<number> {
  const client = getTursoClient();
  const raw = (await getAllAreas()) as { areas: FdArea[] };
  const areas = raw.areas ?? [];
  let count = 0;

  for (const area of areas) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO fbdo_areas (fd_id, name, code, flag_url, parent_area_id, raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        area.id,
        area.name,
        area.code || "",
        area.flag || null,
        area.parentAreaId || null,
        JSON.stringify(area),
      ],
    });
    count++;
  }

  console.log(`  ${count} areas stored`);
  return count;
}
