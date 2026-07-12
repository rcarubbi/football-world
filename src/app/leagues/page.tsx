import Link from "next/link";
import { LEAGUES } from "@/lib/leagues";
import { LeagueIcon } from "@/components/LeagueIcon";
import { Card } from "@/components/ui/Card";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Trophy } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leagues | Football World",
  description: "Explore the world's top football leagues",
  openGraph: {
    title: "Leagues | Football World",
    description: "Explore the world's top football leagues",
  },
};

export default function LigasPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <GlassPanel className="p-6 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex-1">
            <Trophy className="w-8 h-8 inline-block mr-2 text-primary" />
            Leagues
          </h1>
          <ShareButton title="Leagues | Football World" />
        </div>
        <p className="text-muted-foreground">
          Explore the world&apos;s top football leagues
        </p>
      </GlassPanel>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {LEAGUES.map((league) => (
          <Link key={league.slug} href={`/leagues/${league.slug}`}>
            <Card hover className="p-8 h-full">
              <div className="flex items-center gap-5">
                <LeagueIcon slug={league.slug} className="w-20 h-20" />
                <div className="min-w-0">
                  <h2 className="font-bold text-xl leading-tight">{league.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1.5">{league.country}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
