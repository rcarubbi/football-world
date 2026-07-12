import { notFound } from "next/navigation";
import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Trophy, Globe } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `World Cup ${year} | Football World`,
    description: `Bracket and results of the FIFA World Cup ${year}`,
  };
}

async function getWorldCupData(year: string) {
  const client = getTursoClient();

  const cupResult = await client.execute({
    sql: "SELECT * FROM world_cups WHERE year = ?",
    args: [parseInt(year)],
  });
  if (cupResult.rows.length === 0) return null;
  const cup = cupResult.rows[0];

  const [matches, teams] = await Promise.all([
    client.execute({
      sql: "SELECT * FROM world_cup_matches WHERE world_cup_id = ? ORDER BY match_date",
      args: [cup.id as number],
    }),
    client.execute({
      sql: "SELECT * FROM world_cup_teams WHERE world_cup_id = ? ORDER BY team_name",
      args: [cup.id as number],
    }),
  ]);

  return {
    cup,
    matches: matches.rows,
    teams: teams.rows,
  };
}

function BracketMatch({ home, away, homeScore, awayScore }: { home: string; away: string; homeScore: number | null; awayScore: number | null }) {
  const homeWin = homeScore !== null && awayScore !== null && homeScore > awayScore;
  const awayWin = homeScore !== null && awayScore !== null && awayScore > homeScore;

  return (
    <div className="bg-card border border-border rounded-xl p-3 min-w-[180px]">
      <div className={`flex items-center justify-between p-1.5 rounded-lg ${homeWin ? "bg-success/10" : ""}`}>
        <span className="text-xs font-medium truncate flex-1">{home}</span>
        {homeScore !== null && (
          <span className={`text-sm font-bold ml-2 ${homeWin ? "text-success" : ""}`}>{homeScore}</span>
        )}
      </div>
      <div className="h-px bg-border my-1" />
      <div className={`flex items-center justify-between p-1.5 rounded-lg ${awayWin ? "bg-success/10" : ""}`}>
        <span className="text-xs font-medium truncate flex-1">{away}</span>
        {awayScore !== null && (
          <span className={`text-sm font-bold ml-2 ${awayWin ? "text-success" : ""}`}>{awayScore}</span>
        )}
      </div>
    </div>
  );
}

export default async function WorldCupYearPage({ params }: PageProps) {
  const { year } = await params;
  const data = await getWorldCupData(year);
  if (!data) notFound();

  const { cup, matches, teams } = data;

  const stages = [
    { name: "Final", filter: (m: Record<string, unknown>) => m.stage === "Final" },
    { name: "Semifinal", filter: (m: Record<string, unknown>) => m.stage === "Semi-Final" },
    { name: "Quartas de Final", filter: (m: Record<string, unknown>) => m.stage === "Quarter-Final" },
    { name: "Oitavas de Final", filter: (m: Record<string, unknown>) => m.stage === "Round of 16" },
  ];

  const groupedByStage = stages.map((stage) => ({
    ...stage,
    matches: matches.filter(stage.filter),
  }));

  const groupMatches = matches.filter((m: Record<string, unknown>) => m.stage === "Group");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/copa-do-mundo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to World Cups
      </Link>

      <div className="flex items-start gap-6 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold">{cup.year as number}</h1>
          <p className="text-lg text-muted-foreground mt-1">{cup.host_country as string}</p>
        </div>
        <Trophy className="w-16 h-16 text-accent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 text-center">
          <Trophy className="w-6 h-6 text-accent mx-auto mb-2" />
          <div className="text-sm text-muted-foreground">Champion</div>
          <div className="font-bold">{cup.winner as string}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">Runner-up</div>
          <div className="font-bold">{cup.runner_up as string}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">3rd Place</div>
          <div className="font-bold">{cup.third_place as string}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-muted-foreground">4th Place</div>
          <div className="font-bold">{cup.fourth_place as string}</div>
        </Card>
      </div>

      {teams.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-success" />
              Selecoes Participantes ({teams.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {teams.map((team: Record<string, unknown>) => (
                <div key={team.id as number} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  {team.badge_url ? (
                    <img src={team.badge_url as string} alt="" className="w-6 h-6 object-contain" />
                  ) : null}
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{team.team_name as string}</div>
                    {team.group_name ? (
                      <div className="text-[10px] text-muted-foreground">{team.group_name as string}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {groupedByStage.map((stage) => (
          stage.matches.length > 0 && (
            <div key={stage.name}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Badge variant="accent">{stage.name}</Badge>
                <span className="text-muted-foreground text-sm font-normal">({stage.matches.length} matches)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {stage.matches.map((match: Record<string, unknown>) => (
                  <BracketMatch
                    key={match.id as number}
                    home={match.home_team as string}
                    away={match.away_team as string}
                    homeScore={match.home_score as number | null}
                    awayScore={match.away_score as number | null}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {groupMatches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">
            <Badge>Grupos</Badge>
            <span className="text-muted-foreground text-sm font-normal ml-2">({groupMatches.length} matches)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupMatches.map((match: Record<string, unknown>) => (
              <div key={match.id as number} className="bg-card border border-border rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground mb-1">{match.group_name as string}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate flex-1">{match.home_team as string}</span>
                  {match.home_score !== null && (
                    <span className="text-sm font-bold mx-2">{match.home_score as number}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate flex-1">{match.away_team as string}</span>
                  {match.away_score !== null && (
                    <span className="text-sm font-bold mx-2">{match.away_score as number}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
