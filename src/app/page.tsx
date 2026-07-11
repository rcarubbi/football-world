import { LEAGUES } from "@/lib/leagues";
import { LeagueCard } from "@/components/LeagueCard";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Football Wiki Portal
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your comprehensive guide to the world&apos;s most popular football leagues
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          Featured Leagues
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEAGUES.map((league) => (
            <LeagueCard key={league.slug} league={league} />
          ))}
        </div>
      </div>
    </div>
  );
}
