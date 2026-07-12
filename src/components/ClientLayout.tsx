"use client";

import { ReactNode } from "react";
import { ThreeBackground } from "@/components/three/ThreeBackground";
import { InteractiveProvider } from "@/components/three/InteractiveContext";
import { ThemeProvider } from "@/components/three/ThemeProvider";
import { PageTransition } from "@/components/PageTransition";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <InteractiveProvider>
        <ThreeBackground />
        <div className="relative z-10 min-h-screen flex flex-col">
          <div className="flex-1 flex flex-col">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </InteractiveProvider>
    </ThemeProvider>
  );
}
