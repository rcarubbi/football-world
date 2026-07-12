import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { PlayersGrid } from "@/components/PlayersGrid";
import { Star } from "lucide-react";
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
    conditions.push("LOWER(p.name) LIKE ?");
    args.push(`%${searchQuery.toLowerCase()}%`);
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
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <Star className="w-8 h-8 inline-block mr-2 text-accent" />
          Players
        </h1>
        <p className="text-muted-foreground">
          {totalCount} players available
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/players"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !positionFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </Link>
        {positions.map((pos) => (
          <Link
            key={pos}
            href={`/players?position=${pos}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              positionFilter === pos ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {pos}
          </Link>
        ))}
      </div>

      <PlayersGrid
        key={`${searchQuery || ""}-${positionFilter || ""}`}
        initialPlayers={initialResult.rows as unknown as { id: number; name: string; slug: string; photo_url: string | null; position: string | null; nationality: string | null; team_name: string | null; team_badge: string | null }[]}
        totalCount={totalCount}
        initialQuery={searchQuery}
        initialPosition={positionFilter}
      />
    </div>
  );
}
