import { LEAGUES } from "@/lib/leagues";
import { LeagueCard } from "@/components/LeagueCard";

export const metadata = {
  title: "Leagues - Football Wiki",
  description: "Browse all football leagues",
};

export default function LeaguesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Leagues
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse all 8 target leagues
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {LEAGUES.map((league) => (
          <LeagueCard key={league.slug} league={league} />
        ))}
      </div>
    </div>
  );
}
