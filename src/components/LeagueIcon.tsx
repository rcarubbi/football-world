import { LEAGUES } from "@/lib/leagues";

interface LeagueIconProps {
  slug: string;
  className?: string;
}

export function LeagueIcon({ slug, className = "" }: LeagueIconProps) {
  const league = LEAGUES.find((l) => l.slug === slug);

  if (league?.logoUrl) {
    return (
      <div
        className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden border border-border ${className}`}
      >
        <img
          src={league.logoUrl}
          alt={league.name}
          className="w-8 h-8 object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-12 h-12 rounded-xl bg-gray-600 text-white flex items-center justify-center text-sm font-bold shrink-0 ${className}`}
    >
      ?
    </div>
  );
}
