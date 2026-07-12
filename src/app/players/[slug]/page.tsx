import { notFound } from "next/navigation";
import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { getFlagUrl } from "@/lib/flags";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Star, Trophy, Calendar, Ruler, Weight } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = getTursoClient();
  const result = await client.execute({ sql: "SELECT name FROM players WHERE slug = ?", args: [slug] });
  const player = result.rows[0];
  if (!player) return { title: "Player not found" };
  return {
    title: `${player.name} | Football World`,
    description: `Full profile of ${player.name}`,
  };
}

async function getPlayerData(slug: string) {
  const client = getTursoClient();

  const playerResult = await client.execute({ sql: "SELECT * FROM players WHERE slug = ?", args: [slug] });
  if (playerResult.rows.length === 0) return null;
  const player = playerResult.rows[0];

  const [honours, formerTeams, team] = await Promise.all([
    client.execute({ sql: "SELECT * FROM player_honours WHERE player_id = ? ORDER BY season DESC", args: [player.id as number] }),
    client.execute({ sql: "SELECT * FROM player_former_teams WHERE player_id = ? ORDER BY joined DESC", args: [player.id as number] }),
    player.team_id
      ? client.execute({ sql: "SELECT * FROM teams WHERE id = ?", args: [player.team_id as number] })
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    player,
    honours: honours.rows,
    formerTeams: formerTeams.rows,
    currentTeam: team.rows[0] || null,
  };
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPlayerData(slug);
  if (!data) notFound();

  const { player, honours, formerTeams, currentTeam } = data;

  return (
    <GlassPanel className="max-w-4xl mx-auto px-4 sm:px-6 py-8 m-4">
      <Link href="/players" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Players
      </Link>

      <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
        {player.photo_url ? (
          <img
            src={player.photo_url as string}
            alt={player.name as string}
            className="w-32 h-32 rounded-2xl object-cover border-2 border-border"
          />
        ) : (
          <div className="w-32 h-32 rounded-2xl bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
            {(player.name as string).split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold">{player.name as string}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {player.position ? <Badge variant="accent">{player.position as string}</Badge> : null}
            {player.nationality ? (
              <div className="flex items-center gap-1.5">
                {getFlagUrl(player.nationality as string) ? (
                  <img src={getFlagUrl(player.nationality as string)!} alt="" className="w-5 h-auto" />
                ) : null}
                <span className="text-sm text-muted-foreground">{player.nationality as string}</span>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {player.date_of_birth ? (
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-medium">
                  {new Date(player.date_of_birth as string).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </div>
                  <div className="text-xs text-muted-foreground">Birth</div>
              </div>
            ) : null}
            {player.height ? (
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <Ruler className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-medium">{player.height as string}</div>
                <div className="text-xs text-muted-foreground">Height</div>
              </div>
            ) : null}
            {player.weight ? (
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <Weight className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-medium">{player.weight as string}</div>
                  <div className="text-xs text-muted-foreground">Weight</div>
              </div>
            ) : null}
            {currentTeam && (
              <Link href={`/teams/${currentTeam.slug}`} className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                {currentTeam.badge_url ? (
                  <img src={currentTeam.badge_url as string} alt="" className="w-8 h-8 mx-auto mb-1 object-contain" />
                ) : null}
                <div className="text-sm font-medium">{currentTeam.name as string}</div>
                <div className="text-xs text-muted-foreground">Current Team</div>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {(player.career_summary || player.description) ? (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">Biography</h2>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
                {player.career_summary ? <p>{player.career_summary as string}</p> : null}
                {player.description ? <p>{player.description as string}</p> : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {honours.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-accent" />
                Honours ({honours.length})
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {honours.map((h: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Trophy className="w-5 h-5 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{h.honour_name as string}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.season ? `${h.season}` : ""}
                        {h.team_name ? ` - ${h.team_name}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {formerTeams.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Former Teams ({formerTeams.length})
              </h2>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                {formerTeams.map((ft: Record<string, unknown>, i: number) => (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="p-3 rounded-xl bg-muted/30">
                      <div className="text-sm font-medium">{ft.team_name as string}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ft.joined ? `Joined: ${ft.joined}` : ""}
                        {ft.departed ? ` | Left: ${ft.departed}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </GlassPanel>
  );
}
