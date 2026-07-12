import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { Card } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Search, Users, Star, Trophy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search | Football World",
  description: "Search teams, players and leagues",
};

async function searchAll(q: string) {
  if (!q || q.length < 2) return { teams: [], players: [] };

  const client = getTursoClient();
  const pattern = `%${q}%`;

  const [teamsResult, playersResult] = await Promise.all([
    client.execute({
      sql: `SELECT name, slug, badge_url, league_slug FROM teams WHERE name LIKE ? ORDER BY name LIMIT 10`,
      args: [pattern],
    }),
    client.execute({
      sql: `SELECT p.name, p.slug, p.photo_url, p.position, t.name as team_name, t.slug as team_slug, t.badge_url as team_badge
            FROM players p LEFT JOIN teams t ON p.team_id = t.id
            WHERE p.name LIKE ? ORDER BY p.name LIMIT 10`,
      args: [pattern],
    }),
  ]);

  return {
    teams: teamsResult.rows,
    players: playersResult.rows,
  };
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const results = await searchAll(query);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="p-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <Search className="w-8 h-8 inline-block mr-2 text-primary" />
          Search
        </h1>
        {query && (
          <p className="text-muted-foreground">
            Results for &quot;{query}&quot;
          </p>
        )}
      </GlassPanel>

      {!query || query.length < 2 ? (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Type at least 2 characters to search</p>
        </div>
      ) : (
        <div className="space-y-8">
          {results.teams.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Teams ({results.teams.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.teams.map((team) => (
                  <Link key={team.slug as string} href={`/teams/${team.slug}`}>
                    <Card hover className="p-4">
                      <div className="flex items-center gap-3">
                        {team.badge_url ? (
                          <img src={team.badge_url as string} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <Users className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{team.name as string}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <LeagueIcon slug={team.league_slug as string} className="w-4 h-4 text-[8px]" />
                            <span className="text-xs text-muted-foreground">{team.league_slug as string}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.players.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                Players ({results.players.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.players.map((player) => (
                  <Link key={player.slug as string} href={`/players/${player.slug}`}>
                    <Card hover className="p-4">
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <img src={player.photo_url as string} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {(player.name as string).split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{player.name as string}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {player.position && <Badge variant="outline" className="text-[10px]">{player.position as string}</Badge>}
                            {player.team_name && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {player.team_badge && <img src={player.team_badge as string} alt="" className="w-3 h-3 object-contain" />}
                                {player.team_name as string}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.teams.length === 0 && results.players.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
