"use client";
import {reportSentinelFailure} from "./sentinel";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  title: string;
  /** A `value` from erp-config's ROLES. The shell shows the matching label;
      it is not selectable -- the role is whatever the account carries. */
  role: string;
  /** A `value` from erp-config's BRANCHES. */
  branch: string;
  /** The account's tenant. Derived server-side and returned with the session;
      the client never asserts it, because a tenant a client can claim is not
      isolation. */
  tenantId: string;
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
const INVALIDATED_EVENT = "nexora-session-invalidated";

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
  return "http://localhost:3200";
}

export const API_BASE = apiBase();
const API = API_BASE;

/**
 * The session token, for callers that cannot go through authedFetch — a
 * WebSocket, whose handshake cannot carry an Authorization header.
 *
 * Exported so no other package has to know the storage key. A second copy of
 * the literal is a rename away from a bug that looks like an auth failure, and
 * that is exactly how it presented the first time.
 */
export function readToken(): string | null {
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
  const generation = useRef(0);

  /* Invalidate the rendered session before validating a token from another
     window. Request generations prevent late responses from restoring old users. */
  useEffect(() => {
    const validate = async () => {
      const request = ++generation.current;
      const token = readToken();
      setUser(null);
      setStatus(token ? "loading" : "anonymous");
      if (!token) return;
      const current = () => generation.current === request && readToken() === token;
      try {
        const response = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!current()) return;
        if (!response.ok) {
          writeToken(null);
          setStatus("anonymous");
          return;
        }
        const body = (await response.json()) as { user: SessionUser };
        if (!current()) return;
        setUser(body.user);
        setStatus("authenticated");
      } catch {
        /* An unreachable API cannot establish that this token is valid. Do not
           guess permissively and strand the user in an unusable signed-in shell. */
        if (current()) { writeToken(null); setStatus("anonymous"); }
      }
    };
    const storageChanged = (event: StorageEvent) => {
      if ((event.key === STORAGE_KEY || event.key === null) &&
          (!event.storageArea || event.storageArea === window.localStorage)) void validate();
    };
    const invalidated = () => { void validate(); };
    window.addEventListener("storage", storageChanged);
    window.addEventListener(INVALIDATED_EVENT, invalidated);
    void validate();
    return () => {
      generation.current++;
      window.removeEventListener("storage", storageChanged);
      window.removeEventListener(INVALIDATED_EVENT, invalidated);
    };
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    const request = ++generation.current;
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
    if (generation.current !== request) return "Sign-in was cancelled. Please try again.";
    writeToken(body.token);
    setUser(body.user);
    setStatus("authenticated");
    return null;
  }, []);

  const logout = useCallback(async () => {
    generation.current++;
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

/** fetch with the stored bearer attached. Callers get a plain Response; a 401 means
    the session died server-side (an API restart drops every token) and the caller
    should treat it as signed out rather than retrying. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = readToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const monitoring=path.startsWith('/monitoring/');
  const report=(status?:number)=>{if(!monitoring&&typeof window!=='undefined')reportSentinelFailure({kind:'request',code:'request-failed',status});};
  const timer=!monitoring&&typeof window!=='undefined'?setTimeout(()=>reportSentinelFailure({kind:'request',code:'request-timeout'}),15000):undefined;
  let response:Response;
  try{response=await fetch(`${API}${path}`, { ...init, headers });}catch(error){if(!init.signal?.aborted)report();throw error;}finally{if(timer!==undefined)clearTimeout(timer);}
  if(response.status>=500||response.status===429)report(response.status);
  if (response.status === 401 && !monitoring && token && readToken() === token) {
    writeToken(null);
    window.dispatchEvent(new Event(INVALIDATED_EVENT));
  }
  return response;
}

export const DEMO_ACCOUNTS: Array<{ username: string; label: string; role: string }> = [
  { username: "user1", label: "Aisha Rahman", role: "Finance Manager" },
  { username: "user2", label: "Omar Khan", role: "Operations Analyst" },
  { username: "admin", label: "Prakash Mathew", role: "Enterprise Administrator" },
];
