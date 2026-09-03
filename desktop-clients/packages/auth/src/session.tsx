"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  title: string;
  /** A `value` from erp-config's ROLES, so the shell's role selector can reflect it. */
  role: string;
  /** A `value` from erp-config's BRANCHES. */
  branch: string;
}

export type SessionStatus = "loading" | "anonymous" | "authenticated";

export interface SessionValue {
  status: SessionStatus;
  user: SessionUser | null;
  /** Resolves to null on success, or the message to show under the form. */
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "nexora-session-token";

/* Read once at module scope so both bundlers can statically replace it. Next inlines
   process.env.NEXT_PUBLIC_*; Vite inlines import.meta.env.VITE_*. Neither understands
   the other's form, so each is guarded rather than assumed. */
function apiBase(): string {
  try {
    const vite = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (vite?.VITE_API_URL) return vite.VITE_API_URL;
  } catch {
    // import.meta is unavailable in some CJS interop paths; fall through.
  }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:4000";
}

const API = apiBase();

function readToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    /* Private browsing and some embedded webviews throw on access rather than
       returning null. Treat it as signed out rather than crashing the shell. */
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage is unavailable; the session simply will not survive a reload.
  }
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  /* Re-validate a stored token on mount. Trusting it blind would render a signed-in
     shell whose every request then 401s — the failure looks like a broken app rather
     than an expired session. */
  useEffect(() => {
    let cancelled = false;
    const token = readToken();
    if (!token) {
      setStatus("anonymous");
      return;
    }
    (async () => {
      try {
        const response = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        if (!response.ok) {
          writeToken(null);
          setStatus("anonymous");
          return;
        }
        const body = (await response.json()) as { user: SessionUser };
        if (cancelled) return;
        setUser(body.user);
        setStatus("authenticated");
      } catch {
        /* The API being down is indistinguishable here from a bad token, and guessing
           wrong in the permissive direction would strand the user in a broken shell. */
        if (!cancelled) {
          writeToken(null);
          setStatus("anonymous");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    let response: Response;
    try {
      response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      return `Could not reach the demo API at ${API}. Start it with: node dummy-api/server.mjs`;
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return body.error ?? "Sign-in failed.";
    }
    const body = (await response.json()) as { token: string; user: SessionUser };
    writeToken(body.token);
    setUser(body.user);
    setStatus("authenticated");
    return null;
  }, []);

  const logout = useCallback(async () => {
    const token = readToken();
    writeToken(null);
    setUser(null);
    setStatus("anonymous");
    if (!token) return;
    // Best effort: the local session is already gone either way.
    try {
      await fetch(`${API}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // The demo API being down does not keep the user signed in.
    }
  }, []);

  const value = useMemo<SessionValue>(() => ({ status, user, login, logout }), [login, logout, status, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Throws when unprovided, for the same reason useNavigation does: a silent fallback
    would render a shell that looks signed in and can do nothing. */
export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider");
  return context;
}

export const DEMO_ACCOUNTS: Array<{ username: string; label: string; role: string }> = [
  { username: "user1", label: "Aisha Rahman", role: "Finance Manager" },
  { username: "user2", label: "Omar Khan", role: "Operations Analyst" },
  { username: "admin", label: "Prakash Mathew", role: "Enterprise Administrator" },
];
