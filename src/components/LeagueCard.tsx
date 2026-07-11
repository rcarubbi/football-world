import Link from "next/link";
import { Card, CardContent } from "./ui/Card";
import { TeamBadge } from "./TeamBadge";

interface LeagueCardProps {
  league: {
    slug: string;
    name: string;
    country: string;
  };
}

export function LeagueCard({ league }: LeagueCardProps) {
  return (
    <Link href={`/leagues/${league.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            <span className="text-4xl">
              {league.country === "England" && "🏴󠁧󠁢󠁥󠁮󠁧󠁿"}
              {league.country === "Spain" && "🇪🇸"}
              {league.country === "Germany" && "🇩🇪"}
              {league.country === "Italy" && "🇮🇹"}
              {league.country === "France" && "🇫🇷"}
              {league.country === "Europe" && "🇪🇺"}
              {league.country === "International" && "🌍"}
              {league.country === "Brazil" && "🇧🇷"}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {league.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {league.country}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
