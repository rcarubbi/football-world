import Link from "next/link";
import { getTursoClient } from "@/lib/turso/client";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, Trophy, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Cup | Football World",
  description: "FIFA World Cup history",
};

async function getWorldCups() {
  const client = getTursoClient();
  const result = await client.execute("SELECT * FROM world_cups ORDER BY year DESC");
  return result.rows;
}

export default async function CopaDoMundoPage() {
  const worldCups = await getWorldCups();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          <Globe className="w-8 h-8 inline-block mr-2 text-success" />
          World Cup
        </h1>
        <p className="text-muted-foreground">
          Complete FIFA World Cup history
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {worldCups.map((cup) => (
          <Link key={cup.id as number} href={`/copa-do-mundo/${cup.year}`}>
            <Card hover className="p-6 h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{cup.year as number}</h2>
                  <p className="text-sm text-muted-foreground">{cup.host_country as string}</p>
                </div>
                <Trophy className="w-8 h-8 text-accent" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Champion</Badge>
                  <span className="text-sm font-medium">{cup.winner as string}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Runner-up</Badge>
                  <span className="text-sm text-muted-foreground">{cup.runner_up as string}</span>
                </div>
                {cup.third_place && (
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">3o</Badge>
                    <span className="text-sm text-muted-foreground">{cup.third_place as string}</span>
                  </div>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {worldCups.length === 0 && (
        <div className="text-center py-16">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No World Cup found</p>
        </div>
      )}
    </div>
  );
}
