"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [display, setDisplay] = useState(pathname);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (pathname !== display) {
      // Fade out
      setVisible(false);
      const timer = setTimeout(() => {
        setDisplay(pathname);
        setVisible(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname, display]);

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(8px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      {children}
    </div>
  );
}
