"use client";

import { useState } from "react";
import { getLeagueIconUrl, getLeagueIconFallback } from "@/lib/league-icons";

interface LeagueIconProps {
  slug: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-12 h-12",
  lg: "w-24 h-24",
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

  return (
    <img
      src={imgSrc}
      alt={`League icon`}
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={handleError}
    />
  );
}
