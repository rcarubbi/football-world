import { LEAGUES } from "@/lib/leagues";
import { LeagueIcon } from "./LeagueIcon";

interface LeagueBadgeProps {
  leagueSlug: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const leagueColors: Record<string, { bg: string; text: string }> = {
  "premier-league": { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-800 dark:text-purple-200" },
  "la-liga": { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-800 dark:text-orange-200" },
  "bundesliga": { bg: "bg-red-100 dark:bg-red-900", text: "text-red-800 dark:text-red-200" },
  "serie-a": { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  "ligue-1": { bg: "bg-indigo-100 dark:bg-indigo-900", text: "text-indigo-800 dark:text-indigo-200" },
  "champions-league": { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-800 dark:text-blue-200" },
  "fifa-world-cup": { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-800 dark:text-amber-200" },
  "brasileirao-serie-a": { bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-200" },
};

export function LeagueBadge({ leagueSlug, size = "md", showIcon = false }: LeagueBadgeProps) {
  const league = LEAGUES.find((l) => l.slug === leagueSlug);
  const colors = leagueColors[leagueSlug] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-200" };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]}`}
    >
      {showIcon && <LeagueIcon slug={leagueSlug} size="sm" className="mr-1.5" />}
      {league?.name || leagueSlug}
    </span>
  );
}
