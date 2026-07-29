import { notFound } from "next/navigation";
import Link from "next/link";
import { stripWikiMarkup } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LeagueIcon } from "@/components/LeagueIcon";
import { VideoSection } from "@/components/VideoSection";
import {
  Users,
  MapPin,
  Calendar,
  Video,
  Trophy,
  Globe,
  Palette,
  Ruler,
  Weight,
  Flag,
  Cake,
  ExternalLink,
} from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Metadata } from "next";
import { findTeamBySlug, findTeamLeagues } from "@/lib/db/teams";
import { findPlayersByTeam } from "@/lib/db/players";
import { findMatchesWithBadgesByTeamName } from "@/lib/db/matches";
import { findVideosByTeam } from "@/lib/db/videos";
import { findRecentByTeam as findLineupsByTeam } from "@/lib/db/lineups";
import { findStandingByTeamId } from "@/lib/db/standings";
import { PlayerAvatar } from "@/components/PlayerAvatar";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const team = await findTeamBySlug(slug);
  if (!team) return { title: "Team not found" };
  return {
    title: `${team.name} | Football World`,
    description: `Squad, formation, results and videos of ${team.name}`,
    openGraph: {
      title: `${team.name} | Football World`,
      description: `Squad, formation, results and videos of ${team.name}`,
      images: team.badge_url ? [{ url: team.badge_url, width: 200, height: 200 }] : undefined,
    },
  };
}

async function getTeamData(slug: string) {
  const team = await findTeamBySlug(slug);
  if (!team) return null;

  const leagues = await findTeamLeagues(team.id);
  const primaryLeague = leagues[0] || team.league_slug || '';

  const [players, matches, videos, lineups, standing] = await Promise.all([
    findPlayersByTeam(team.id),
    findMatchesWithBadgesByTeamName(team.name, 10),
    findVideosByTeam(team.id),
    findLineupsByTeam(team.id, 5),
    findStandingByTeamId(team.id, primaryLeague),
  ]);

  return {
    team,
    leagues,
    players,
    matches,
    videos,
    lineups,
    standing,
  };
}

function FormationPitch({
  players,
}: {
  players: Array<{
    player_number: number | null;
    player_name: string | null;
    position: string | null;
    starter: number;
  }>;
}) {
  const positionMap: Record<string, { x: number; y: number }> = {
    Goalkeeper: { x: 50, y: 90 },
    Defender: { x: 50, y: 70 },
    Midfielder: { x: 50, y: 50 },
    Forward: { x: 50, y: 30 },
    Attacker: { x: 50, y: 30 },
  };

  const starters = players.filter((p) => p.starter === 1);
  const posCount: Record<string, number> = {};

  const positions = starters.map((p) => {
    const pos = (p.position as string) || "Midfielder";
    posCount[pos] = (posCount[pos] || 0) + 1;
    const base = positionMap[pos] || positionMap["Midfielder"];
    const offset = (posCount[pos] - 1) * 15 - (posCount[pos] > 1 ? 7.5 : 0);
    return {
      ...p,
      x: Math.max(10, Math.min(90, base.x + offset)),
      y: base.y,
    };
  });

  return (
    <div className="relative w-full aspect-[68/105] max-w-md mx-auto">
      <svg viewBox="0 0 680 1050" className="w-full h-full">
        <rect x="0" y="0" width="680" height="1050" rx="8" fill="#1a5e1a" />

        <line x1="0" y1="525" x2="680" y2="525" stroke="white" strokeWidth="3" opacity="0.6" />
        <circle cx="340" cy="525" r="91.5" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <circle cx="340" cy="525" r="5" fill="white" opacity="0.6" />

        <rect x="0" y="0" width="680" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <rect x="170" y="0" width="340" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <path d="M 170 180 A 91.5 91.5 0 0 0 510 180" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />

        <rect x="0" y="870" width="680" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <rect x="170" y="870" width="340" height="180" rx="0" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />
        <path d="M 170 870 A 91.5 91.5 0 0 1 510 870" fill="none" stroke="white" strokeWidth="3" opacity="0.6" />

        {positions.map((p, i) => {
          const cx = (p.x / 100) * 680;
          const cy = (p.y / 100) * 1050;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="32" fill="#DC2626" stroke="white" strokeWidth="2" />
              <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                {(p.player_number as number) || ""}
              </text>
              <text x={cx} y={cy + 48} textAnchor="middle" fill="white" fontSize="14" fontWeight="500">
                {(p.player_name || "").split(" ").pop()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function TeamDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { from } = await searchParams;
  const data = await getTeamData(slug);
  if (!data) notFound();

  const { team, leagues, players, matches, videos, lineups, standing } = data;
  const leagueSlug = leagues[0] || team.league_slug || '';
  const backHref = from || "/teams";
  const backLabel = from ? "Back" : "Back to Teams";

  const starters = lineups.filter((l) => l.starter === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb backHref={backHref} backLabel={backLabel} />

      {/* ── Header ───────────────────────────────────── */}
      <GlassPanel className="flex flex-col sm:flex-row items-start gap-6 p-6 mb-8">
        {team.badge_url ? (
          <img src={team.badge_url} alt={team.name} className="w-24 h-24 object-contain" />
        ) : null}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold flex-1 truncate">{team.name}</h1>
            <ShareButton title={team.name} image={team.badge_url ?? undefined} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-red-400 dark:text-red-300">
            <Link
              href={`/leagues/${leagueSlug}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <LeagueIcon slug={leagueSlug} className="w-5 h-5 text-[10px]" />
              {leagueSlug}
            </Link>
            {team.stadium && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {team.stadium}
              </span>
            )}
            {team.founded && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Founded {team.founded}
              </span>
            )}
            {team.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {team.location}
              </span>
            )}
            {team.capacity && (
              <span>{team.capacity.toLocaleString()} seats</span>
            )}
            {team.website && (
              <a
                href={team.website.startsWith("http") ? team.website : `https://${team.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> Official website
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {(team.primary_color || team.secondary_color) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-400 dark:text-red-300">
              <Palette className="w-3.5 h-3.5" />
              <span>Colors:</span>
              {team.primary_color && (
                <span
                  className="w-4 h-4 rounded-full border border-white/30 inline-block"
                  style={{ backgroundColor: team.primary_color }}
                  title={`Primary: ${team.primary_color}`}
                />
              )}
              {team.secondary_color && (
                <span
                  className="w-4 h-4 rounded-full border border-white/30 inline-block"
                  style={{ backgroundColor: team.secondary_color }}
                  title={`Secondary: ${team.secondary_color}`}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {team.kit_home_url && <img src={team.kit_home_url} alt="Home kit" className="h-20 object-contain" />}
          {team.kit_away_url && <img src={team.kit_away_url} alt="Away kit" className="h-20 object-contain" />}
          {team.kit_third_url && <img src={team.kit_third_url} alt="Third kit" className="h-20 object-contain" />}
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ── About ─────────────────────────────────── */}
          {(team.wikipedia_content || team.description) && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">About the Team</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {team.wikipedia_content && (
                  <p className="text-sm text-red-400 dark:text-red-300 leading-relaxed line-clamp-6">
                    {stripWikiMarkup(team.wikipedia_content)}
                  </p>
                )}
                {team.description && (
                  <p className="text-sm text-red-400 dark:text-red-300 leading-relaxed">
                    {team.description}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Standings ─────────────────────────────── */}
          {standing && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-accent" />
                  Standings — {standing.season}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{standing.position ?? "—"}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">Position</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold">{standing.points}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">Points</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold">{standing.played}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">Played</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold text-green-500">{standing.won}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">Won</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold text-yellow-500">{standing.drawn}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">Drawn</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold text-red-500">{standing.lost}</div>
                    <div className="text-xs text-red-400 dark:text-red-300">Lost</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="text-2xl font-bold">
                      {standing.goals_for}:{standing.goals_against}
                    </div>
                    <div className="text-xs text-red-400 dark:text-red-300">Goals</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className={`text-2xl font-bold ${standing.goal_difference > 0 ? "text-green-500" : standing.goal_difference < 0 ? "text-red-500" : ""}`}>
                      {standing.goal_difference > 0 ? "+" : ""}{standing.goal_difference}
                    </div>
                    <div className="text-xs text-red-400 dark:text-red-300">GD</div>
                  </div>
                </div>
                {standing.form && (
                  <div className="mt-4 flex items-center gap-1">
                    <span className="text-xs text-red-400 dark:text-red-300 mr-2">Form:</span>
                    {standing.form.split("").map((r, i) => (
                      <span
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          r === "W" ? "bg-green-500" : r === "D" ? "bg-yellow-500" : "bg-red-500"
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Squad ─────────────────────────────────── */}
          {players.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Squad ({players.length})
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {players.map((player) => (
                    <Link
                      key={player.slug}
                      href={`/players/${player.slug}?from=/teams/${slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <PlayerAvatar
                        photoUrl={player.cutout_url || player.photo_url || ""}
                        name={player.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {player.jersey_number && (
                            <span className="text-xs font-bold text-primary">#{player.jersey_number}</span>
                          )}
                          <span className="text-sm font-medium truncate">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-red-400 dark:text-red-300">
                          {player.position && <span>{player.position}</span>}
                          {player.nationality && (
                            <span className="flex items-center gap-0.5">
                              <Flag className="w-3 h-3" /> {player.nationality}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-red-400/70 dark:text-red-300/70">
                          {player.date_of_birth && (
                            <span className="flex items-center gap-0.5">
                              <Cake className="w-3 h-3" /> {/^\d{4}$/.test(player.date_of_birth as string) ? player.date_of_birth as string : new Date(player.date_of_birth as string).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </span>
                          )}
                          {player.height && (
                            <span className="flex items-center gap-0.5">
                              <Ruler className="w-3 h-3" /> {player.height}
                            </span>
                          )}
                          {player.weight && (
                            <span className="flex items-center gap-0.5">
                              <Weight className="w-3 h-3" /> {player.weight}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Results ────────────────────────────────── */}
          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-accent" />
                  Results
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {match.home_badge && (
                          <img src={match.home_badge} alt="" className="w-6 h-6 object-contain shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{match.home_team_name}</span>
                      </div>
                      <div className="px-4 font-bold shrink-0">
                        {match.home_score ?? "-"} - {match.away_score ?? "-"}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate text-right">{match.away_team_name}</span>
                        {match.away_badge && (
                          <img src={match.away_badge} alt="" className="w-6 h-6 object-contain shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* ── Formation ──────────────────────────────── */}
          {starters.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold">Formation</h2>
              </CardHeader>
              <CardContent>
                <FormationPitch players={starters} />
              </CardContent>
            </Card>
          )}

          {/* ── Videos ─────────────────────────────────── */}
          {videos.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Video className="w-6 h-6 text-primary" />
                  Videos
                </h2>
              </CardHeader>
              <CardContent>
                <VideoSection
                  videos={videos.map((v) => ({
                    id: v.id,
                    video_id: v.video_id,
                    title: v.title ?? "Untitled",
                    thumbnail_url: v.thumbnail_url,
                    channel_name: v.channel_name,
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
