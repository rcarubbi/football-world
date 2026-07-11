"use client";

import { useState } from "react";
import { getLeagueIconUrl, getLeagueIconFallback } from "@/lib/league-icons";

interface LeagueIconProps {
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-24 h-24 text-lg",
};

const LEAGUE_INITIALS: Record<string, string> = {
  "premier-league": "PL",
  "la-liga": "LL",
  "bundesliga": "BL",
  "serie-a": "SA",
  "ligue-1": "L1",
  "champions-league": "CL",
  "fifa-world-cup": "WC",
  "brasileirao-serie-a": "BRA",
};

export function LeagueIcon({ slug, size = "md", className = "" }: LeagueIconProps) {
  const [imgSrc, setImgSrc] = useState(getLeagueIconUrl(slug));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setImgSrc(getLeagueIconFallback(slug));
      setHasError(true);
    }
  };

  if (!imgSrc) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 font-bold text-gray-500 ${className}`}>
        {LEAGUE_INITIALS[slug] || slug.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={`League icon`}
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={handleError}
    />
  );
}
