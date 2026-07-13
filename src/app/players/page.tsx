import Link from "next/link";
import { PlayersGrid } from "@/components/PlayersGrid";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Star } from "lucide-react";

import { ShareButton } from "@/components/ShareButton";
import type { Metadata } from "next";
import { countPlayersWithFilters, findPlayersFiltered } from "@/lib/db/players";

export const metadata: Metadata = {
  title: "Players | Football World",
  description: "Explore all football players",
  openGraph: {
    title: "Players | Football World",
    description: "Explore all football players",
  },
};

export default async function JogadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; position?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q;
  const positionFilter = params.position;

  const filters = {
    query: searchQuery,
    position: positionFilter,
  };

  const [totalCount, initialPlayers] = await Promise.all([
    countPlayersWithFilters(filters),
    findPlayersFiltered(filters, 30),
  ]);

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Attacker"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="p-6 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex-1">
            <Star className="w-8 h-8 inline-block mr-2 text-accent" />
            Players
          </h1>
          <ShareButton title="Players | Football World" />
        </div>
        <p className="text-red-400 dark:text-red-300">
          {totalCount} players available
        </p>
      </GlassPanel>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/players"
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !positionFilter ? "bg-primary text-primary-foreground" : "bg-muted/80 backdrop-blur-md text-red-400 dark:text-red-300 hover:bg-muted/60 border border-white/10"
          }`}
        >
          All
        </Link>
        {positions.map((pos) => (
          <Link
            key={pos}
            href={`/players?position=${pos}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              positionFilter === pos ? "bg-primary text-primary-foreground" : "bg-muted/80 backdrop-blur-md text-red-400 dark:text-red-300 hover:bg-muted/60 border border-white/10"
            }`}
          >
            {pos}
          </Link>
        ))}
      </div>

      <PlayersGrid
        key={`${searchQuery || ""}-${positionFilter || ""}`}
        initialPlayers={initialPlayers.map((r) => ({
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
