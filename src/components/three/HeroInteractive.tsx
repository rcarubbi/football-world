"use client";

import { useEffect, useRef } from "react";
import { use3DInteractive } from "@/components/three/InteractiveContext";

export function HeroInteractive() {
  const { setInteractive } = use3DInteractive();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInteractive(entry.isIntersecting && entry.intersectionRatio > 0.3);
      },
      { threshold: [0, 0.3, 0.5, 1] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [setInteractive]);

  return (
    <div ref={ref} className="absolute inset-0 z-5 pointer-events-auto" />
  );
}
