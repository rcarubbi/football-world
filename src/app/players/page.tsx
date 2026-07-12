import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { PlayersGrid } from "@/components/PlayersGrid";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Star } from "lucide-react";
import { stripAccents, sqlStripAccents } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players | Football World",
  description: "Explore all football players",
};

export default async function JogadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; position?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q;
  const positionFilter = params.position;

  const client = getTursoClient();

  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (searchQuery) {
    conditions.push(`${sqlStripAccents("p.name")} LIKE ?`);
    args.push(`%${stripAccents(searchQuery).toLowerCase()}%`);
  }
  if (positionFilter) {
    conditions.push("LOWER(p.position) = ?");
    args.push(positionFilter.toLowerCase());
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const countResult = await client.execute({
    sql: `SELECT COUNT(*) as n FROM players p ${where}`,
    args,
  });
  const totalCount = countResult.rows[0].n as number;

  const initialResult = await client.execute({
    sql: `
      SELECT p.id, p.name, p.slug, p.photo_url, p.position, p.nationality,
             t.name as team_name, t.badge_url as team_badge
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${where}
      ORDER BY p.name
      LIMIT 30
    `,
    args,
  });

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Attacker"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="p-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <Star className="w-8 h-8 inline-block mr-2 text-accent" />
          Players
        </h1>
        <p className="text-muted-foreground">
          {totalCount} players available
        </p>
      </GlassPanel>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/players"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !positionFilter ? "bg-primary text-primary-foreground" : "bg-muted/80 backdrop-blur-md text-muted-foreground hover:bg-muted/60 border border-white/10"
          }`}
        >
          All
        </Link>
        {positions.map((pos) => (
          <Link
            key={pos}
            href={`/players?position=${pos}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              positionFilter === pos ? "bg-primary text-primary-foreground" : "bg-muted/80 backdrop-blur-md text-muted-foreground hover:bg-muted/60 border border-white/10"
            }`}
          >
            {pos}
          </Link>
        ))}
      </div>

      <PlayersGrid
        key={`${searchQuery || ""}-${positionFilter || ""}`}
        initialPlayers={initialResult.rows.map((r) => ({
          id: r.id as number,
          name: r.name as string,
          slug: r.slug as string,
          photo_url: r.photo_url as string | null,
          position: r.position as string | null,
          nationality: r.nationality as string | null,
          team_name: r.team_name as string | null,
          team_badge: r.team_badge as string | null,
        }))}
        totalCount={totalCount}
        initialQuery={searchQuery}
        initialPosition={positionFilter}
      />
    </div>
  );
}
