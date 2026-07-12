"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface ThemeCtx {
  isDark: boolean;
  colors: {
    sky: string;
    ambient: string;
    spot: string;
    stand: string;
    crowd: string;
    grass1: string;
    grass2: string;
    line: string;
  };
}

const DARK: ThemeCtx["colors"] = {
  sky: "#0a0a0a",
  ambient: "#FFF5E6",
  spot: "#FFF8EE",
  stand: "#1a1a2e",
  crowd: "#2a2a3e",
  grass1: "#1a6b35",
  grass2: "#1d7a3d",
  line: "#ffffff",
};

const LIGHT: ThemeCtx["colors"] = {
  sky: "#e8e4de",
  ambient: "#FFF5E6",
  spot: "#FFF8EE",
  stand: "#d4d0c8",
  crowd: "#c4bfb3",
  grass1: "#2d8a4e",
  grass2: "#34995a",
  line: "#ffffff",
};

const Ctx = createContext<ThemeCtx>({
  isDark: true,
  colors: DARK,
});

export function useTheme() {
  return useContext(Ctx);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const value = {
    isDark,
    colors: isDark ? DARK : LIGHT,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
