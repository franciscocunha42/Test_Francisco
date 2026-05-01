"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { SignupGate } from "@/components/SignupGate";

interface RequireAuthContextValue {
  guard: (actionLabel: string, onAuthed?: () => void | Promise<void>) => void;
}

const RequireAuthContext = createContext<RequireAuthContextValue | null>(null);

export function RequireAuthProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [actionLabel, setActionLabel] = useState("save your wedding");
  const [pending, setPending] = useState<(() => void | Promise<void>) | null>(null);

  const guard = useCallback((label: string, onAuthed?: () => void | Promise<void>) => {
    setActionLabel(label);
    setPending(() => onAuthed ?? null);
    setOpen(true);
  }, []);

  async function handleAuthed() {
    if (pending) {
      await pending();
      setPending(null);
    }
  }

  return (
    <RequireAuthContext.Provider value={{ guard }}>
      {children}
      <SignupGate
        open={open}
        actionLabel={actionLabel}
        onClose={() => setOpen(false)}
        onAuthed={handleAuthed}
      />
    </RequireAuthContext.Provider>
  );
}

export function useRequireAuth() {
  const ctx = useContext(RequireAuthContext);
  if (!ctx) {
    throw new Error("useRequireAuth must be used inside RequireAuthProvider");
  }
  return ctx;
}
