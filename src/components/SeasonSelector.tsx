"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface SeasonSelectorProps {
  seasons: string[];
  currentSeason: string;
}

export function SeasonSelector({ seasons, currentSeason }: SeasonSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("season", value);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  if (seasons.length <= 1) return null;

  return (
    <div className="relative inline-flex items-center gap-2">
      <label className="text-sm text-red-400 dark:text-red-300">Season:</label>
      <div className="relative">
        <select
          value={currentSeason}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none bg-muted/50 border border-border rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}/{String(Number(s) + 1).slice(-2)}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-red-400 dark:text-red-300" />
      </div>
    </div>
  );
}
