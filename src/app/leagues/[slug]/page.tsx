import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { LEAGUES, getLeagueBySlug } from "@/lib/leagues";
import { getTursoClient } from "@/lib/turso/client";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { VideoSection } from "@/components/VideoSection";
import { Trophy, TrendingUp, Calendar, Video, ArrowRight, Star } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { SeasonSelector } from "@/components/SeasonSelector";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const league = getLeagueBySlug(slug);
  if (!league) return { title: "League not found" };
  return {
    title: `${league.name} | Football World`,
    description: `Standings, results and matches of ${league.name}`,
    openGraph: {
      title: `${league.name} | Football World`,
      description: `Standings, results and matches of ${league.name}`,
      images: [{ url: league.logoUrl, width: 200, height: 200 }],
    },
  };
}

export function generateStaticParams() {
  return LEAGUES.map((l) => ({ slug: l.slug }));
}

async function getLeagueData(slug: string, season: string) {
  const client = getTursoClient();

  const [standingsResult, seasonsResult, topScorers, upcomingMatches, recentMatches, videos, transfers] = await Promise.all([
    client.execute({
      sql: `SELECT ls.*, t.slug as team_slug, t.badge_url as team_badge FROM league_standings ls LEFT JOIN teams t ON ls.team_name = t.name WHERE ls.league_slug = ? AND ls.season = ? ORDER BY ls.position`,
      args: [slug, season],
    }),
    client.execute({
      sql: `SELECT DISTINCT season FROM league_standings WHERE league_slug = ? ORDER BY season DESC`,
      args: [slug],
    }),
    client.execute({
      sql: `SELECT * FROM top_scorers WHERE league_slug = ? ORDER BY goals DESC LIMIT 10`,
      args: [slug],
    }),
    client.execute({
      sql: `SELECT m.*, t1.badge_url as home_badge, t2.badge_url as away_badge FROM matches m LEFT JOIN teams t1 ON m.home_team_name = t1.name LEFT JOIN teams t2 ON m.away_team_name = t2.name WHERE m.league_slug = ? AND m.match_date < date('now') ORDER BY m.match_date DESC LIMIT 10`,
      args: [slug],
    }),
    client.execute({
      sql: `SELECT m.*, t1.badge_url as home_badge, t2.badge_url as away_badge FROM matches m LEFT JOIN teams t1 ON m.home_team_name = t1.name LEFT JOIN teams t2 ON m.away_team_name = t2.name WHERE m.league_slug = ? AND m.match_date >= date('now') ORDER BY m.match_date ASC LIMIT 10`,
      args: [slug],
    }),
    client.execute({
      sql: `SELECT * FROM videos WHERE league_slug = ? ORDER BY published_at DESC LIMIT 10`,
      args: [slug],
    }),
    client.execute({
      sql: `SELECT * FROM transfers WHERE league_slug = ? ORDER BY transfer_date DESC LIMIT 10`,
      args: [slug],
    }),
  ]);

  return {
    standings: standingsResult.rows,
    seasons: seasonsResult.rows.map((r) => r.season as string),
    topScorers: topScorers.rows,
    upcomingMatches: upcomingMatches.rows,
    recentMatches: recentMatches.rows,
    videos: videos.rows,
    transfers: transfers.rows,
  };
}

export default async function LigaDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { season: requestedSeason } = await searchParams;
  const league = getLeagueBySlug(slug);
  if (!league) notFound();

  const season = requestedSeason || new Date().getFullYear().toString();
  const data = await getLeagueData(slug, season);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="flex items-center gap-4 p-6 mb-8">
        <LeagueIcon slug={slug} className="w-16 h-16 text-xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-bold">{league.name}</h1>
          <p className="text-muted-foreground">{league.country}</p>
        </div>
        <ShareButton title={league.name} image={league.logoUrl} />
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {data.standings.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Standings
                  </h2>
                  <Suspense>
                    <SeasonSelector
                      seasons={data.seasons}
                      currentSeason={season}
                    />
                  </Suspense>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell className="w-10 px-2">#</TableCell>
                      <TableCell className="px-2">Team</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">P</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">W</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">D</TableCell>
                      <TableCell className="text-center px-2 hidden sm:table-cell">L</TableCell>
                      <TableCell className="text-center font-bold px-2">Pts</TableCell>
                      <TableCell className="hidden md:table-cell px-2">Form</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.standings.map((row: Record<string, unknown>) => (
                      <TableRow key={row.id as number}>
                        <TableCell className="font-medium px-2">{row.position as number}</TableCell>
                        <TableCell className="px-2">
                          <Link href={`/teams/${row.team_slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            {row.team_badge ? (
                              <img src={row.team_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" />
                            ) : null}
                            <span className="font-medium text-sm truncate max-w-[120px]">{row.team_name as string}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground px-2 hidden sm:table-cell">{row.played as number}</TableCell>
                        <TableCell className="text-center text-success px-2 hidden sm:table-cell">{row.won as number}</TableCell>
                        <TableCell className="text-center text-muted-foreground px-2 hidden sm:table-cell">{row.drawn as number}</TableCell>
                        <TableCell className="text-center text-destructive px-2 hidden sm:table-cell">{row.lost as number}</TableCell>
                        <TableCell className="text-center font-bold px-2">{row.points as number}</TableCell>
                        <TableCell className="hidden md:table-cell px-2">
                          <div className="flex gap-0.5">
                            {(row.form as string || "").split("").map((f: string, i: number) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                                  f === "W" ? "bg-success/20 text-success" :
                                  f === "D" ? "bg-muted text-muted-foreground" :
                                  "bg-destructive/20 text-destructive"
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.recentMatches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Recent Results
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.recentMatches.map((match: Record<string, unknown>) => (
                    <div key={match.id as number} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.home_badge ? <img src={match.home_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" /> : null}
                        <span className="text-sm font-medium truncate">{match.home_team_name as string}</span>
                      </div>
                      <div className="px-4 font-bold shrink-0">
                        {match.home_score as number ?? "-"} - {match.away_score as number ?? "-"}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right">{match.away_team_name as string}</span>
                        {match.away_badge ? <img src={match.away_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.upcomingMatches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-accent" />
                  Upcoming Matches
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.upcomingMatches.map((match: Record<string, unknown>) => (
                    <div key={match.id as number} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.home_badge ? <img src={match.home_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" /> : null}
                        <span className="text-sm font-medium truncate">{match.home_team_name as string}</span>
                      </div>
                      <div className="px-4 text-sm text-muted-foreground shrink-0">
                        {match.match_date as string} {match.match_time ? `${match.match_time}` : ""}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right">{match.away_team_name as string}</span>
                        {match.away_badge ? <img src={match.away_badge as string} alt="" className="w-6 h-6 object-contain shrink-0" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {data.topScorers.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Star className="w-6 h-6 text-accent" />
                  Top Scorers
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topScorers.map((scorer: Record<string, unknown>, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className="text-sm font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{scorer.player_name as string}</div>
                        <div className="text-xs text-muted-foreground">{scorer.team_name as string}</div>
                      </div>
                      <Badge variant="accent">{scorer.goals as number} G</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.videos.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  Videos
                </h2>
              </CardHeader>
              <CardContent>
                <VideoSection
                  videos={data.videos.map((v) => ({
                    id: v.id as number,
                    video_id: v.video_id as string,
                    title: v.title as string,
                    thumbnail_url: v.thumbnail_url as string | null,
                    channel_name: v.channel_name as string | null,
                  }))}
                  limit={5}
                />
              </CardContent>
            </Card>
          )}

          {data.transfers.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ArrowRight className="w-6 h-6 text-primary" />
                  Transfers
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.transfers.slice(0, 5).map((transfer: Record<string, unknown>, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/30">
                      <div className="text-sm font-medium">{transfer.player_name as string}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {transfer.from_team as string} → {transfer.to_team as string}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{transfer.transfer_type as string}</Badge>
                        {transfer.transfer_fee ? (
                          <Badge variant="accent">{transfer.transfer_fee as string}</Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
