import Link from "next/link";
import { Card, CardContent } from "./ui/Card";
import {
  Globe,
  Trophy,
  Shield,
  MapPin,
  Star,
  Flag,
  Zap,
  Crown,
} from "lucide-react";

interface LeagueCardProps {
  league: {
    slug: string;
    name: string;
    country: string;
  };
}

const countryIcons: Record<string, React.ReactNode> = {
  England: <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />,
  Spain: <Flag className="w-10 h-10 text-orange-600 dark:text-orange-400" />,
  Germany: <Zap className="w-10 h-10 text-red-600 dark:text-red-400" />,
  Italy: <Star className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
  France: <Crown className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />,
  Europe: <Trophy className="w-10 h-10 text-blue-600 dark:text-blue-400" />,
  International: <Globe className="w-10 h-10 text-amber-600 dark:text-amber-400" />,
  Brazil: <MapPin className="w-10 h-10 text-green-600 dark:text-green-400" />,
};

export function LeagueCard({ league }: LeagueCardProps) {
  return (
    <Link href={`/leagues/${league.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            {countryIcons[league.country] || (
              <Globe className="w-10 h-10 text-gray-600 dark:text-gray-400" />
            )}
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
