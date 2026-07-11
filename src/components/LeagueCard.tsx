import Link from "next/link";
import { Card, CardContent } from "./ui/Card";
import { LeagueIcon } from "./LeagueIcon";

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
            <LeagueIcon slug={league.slug} size="lg" />
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
