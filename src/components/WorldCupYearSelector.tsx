"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface WorldCupYearSelectorProps {
  years: number[];
  currentYear: number;
}

export function WorldCupYearSelector({ years, currentYear }: WorldCupYearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", value);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  if (years.length <= 1) return null;

  return (
    <div className="relative inline-flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Year:</label>
      <div className="relative">
        <select
          value={currentYear}
          onChange={(e) => handleChange(e.target.value)}
          className="appearance-none bg-muted/50 border border-border rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-foreground cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-muted-foreground" />
      </div>
    </div>
  );
}
