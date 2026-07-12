"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getFlagUrl } from "@/lib/flags";
import { Loader2, Search } from "lucide-react";

interface Player {
  id: number;
  name: string;
  slug: string;
  photo_url: string | null;
  position: string | null;
  nationality: string | null;
  team_name: string | null;
  team_badge: string | null;
}

interface PlayersResponse {
  players: Player[];
  total: number;
  page: number;
  hasMore: boolean;
}

export function PlayersGrid({
  initialPlayers,
  totalCount,
  initialQuery,
  initialPosition,
}: {
  initialPlayers: Player[];
  totalCount: number;
  initialQuery?: string;
  initialPosition?: string;
}) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialPlayers.length < totalCount);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "30" });
      if (initialQuery) params.set("q", initialQuery);
      if (initialPosition) params.set("position", initialPosition);
      const res = await fetch(`/api/players?${params}`);
      const data: PlayersResponse = await res.json();
      setPlayers((prev) => [...prev, ...data.players]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, initialQuery, initialPosition]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {players.map((player) => (
          <Link key={`${player.slug}-${player.id}`} href={`/players/${player.slug}`}>
            <Card hover className="p-4 text-center h-full">
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-border"
                  loading="lazy"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center text-xl font-bold text-primary">
                  {player.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="font-medium text-sm leading-tight">{player.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{player.position || "N/A"}</div>
              {player.team_name && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {player.team_badge && (
                    <img src={player.team_badge} alt="" className="w-4 h-4 object-contain" loading="lazy" />
                  )}
                  <span className="text-xs text-muted-foreground truncate">{player.team_name}</span>
                </div>
              )}
              {player.nationality && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  {getFlagUrl(player.nationality) ? (
                    <img src={getFlagUrl(player.nationality)!} alt="" className="w-4 h-auto" loading="lazy" />
                  ) : null}
                  <span className="text-xs text-muted-foreground">{player.nationality}</span>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <div ref={sentinelRef} className="py-8 flex justify-center">
        {loading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
        {!hasMore && players.length > 0 && (
          <p className="text-sm text-muted-foreground">All {totalCount} players loaded</p>
        )}
        {!loading && players.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No players found</p>
          </div>
        )}
      </div>
    </>
  );
}
