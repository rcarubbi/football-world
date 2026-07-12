"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const Ctx = createContext<{
  interactive: boolean;
  setInteractive: (v: boolean) => void;
}>({ interactive: false, setInteractive: () => {} });

export function use3DInteractive() {
  return useContext(Ctx);
}

export function InteractiveProvider({ children }: { children: ReactNode }) {
  const [interactive, setInteractive] = useState(false);
  return (
    <Ctx.Provider value={{ interactive, setInteractive: useCallback((v: boolean) => setInteractive(v), []) }}>
      {children}
    </Ctx.Provider>
  );
}
