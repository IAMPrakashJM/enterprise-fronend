import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { API_BASE, DEMO_ACCOUNTS, SessionProvider, authedFetch, readToken, useSession } from "./session.tsx";

/**
 * The session.
 *
 * Two things here are worth more than the plumbing. A stored token is
 * REVALIDATED rather than trusted, because trusting it renders a signed-in
 * shell whose every request then 401s — which looks like a broken application
 * rather than an expired session. And every failure resolves towards signed
 * OUT: the API being down is indistinguishable from a bad token, and guessing
 * permissively strands the user in a shell that cannot do anything.
 */

const STORAGE_KEY = "nexora-session-token";

const user = {
  id: "u1",
  name: "Aisha Rahman",
  email: "aisha@nexora.ae",
  initials: "AR",
  title: "Finance Manager",
  role: "finance-manager",
  branch: "dubai",
  tenantId: "t1",
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

/* A failed thenable rather than a rejected promise: vitest reports a rejection
   raised inside a mock as an unhandled error against whichever test happens to
   be running when it surfaces. Nothing here ever rejects, and the code under
   test still takes its catch branch. */
const offline = () => ({
  then: (_resolve: unknown, reject: (error: unknown) => void) => reject(new TypeError("Failed to fetch")),
});

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Probe() {
  const session = useSession();
  return (
    <div>
      <output data-testid="status">{session.status}</output>
      <output data-testid="user">{session.user?.name ?? "-"}</output>
      <button onClick={() => void session.login("user1", "pw")}>sign in</button>
      <button onClick={() => void session.logout()}>sign out</button>
    </div>
  );
}

const mount = () => render(<SessionProvider><Probe /></SessionProvider>);
const status = () => screen.getByTestId("status").textContent;
const click = async (label: string) => {
  await act(async () => {
    screen.getByText(label).click();
  });
};

describe("the stored token", () => {
  test("no token means anonymous, and nothing is asked of the API", async () => {
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /* Revalidated, not trusted. */
  test("a stored token is checked against the API before anything renders signed in", async () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    fetchMock.mockResolvedValue(json(200, { user }));
    mount();
    await waitFor(() => expect(status()).toBe("authenticated"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/auth/me`);
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(screen.getByTestId("user").textContent).toBe("Aisha Rahman");
  });

  test("a token the API rejects is thrown away, not kept for the next reload", async () => {
    window.localStorage.setItem(STORAGE_KEY, "stale");
    fetchMock.mockResolvedValue(json(401, {}));
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  /* The API being down is indistinguishable from a bad token. Guessing
     permissively would render a signed-in shell that can do nothing. */
  test("an unreachable API also signs the user out", async () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    fetchMock.mockImplementation(() => offline() as unknown as Promise<Response>);
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("nothing is claimed while the check is still in flight", async () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    let settle: (response: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => { settle = resolve; }));
    mount();
    expect(status()).toBe("loading");
    await act(async () => { settle(json(200, { user })); });
    await waitFor(() => expect(status()).toBe("authenticated"));
  });
});

describe("signing in", () => {
  test("stores the token and the user the server returned", async () => {
    fetchMock.mockResolvedValue(json(200, { token: "tok-new", user }));
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    await click("sign in");
    await waitFor(() => expect(status()).toBe("authenticated"));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("tok-new");
    expect(screen.getByTestId("user").textContent).toBe("Aisha Rahman");
  });

  test("posts the credentials as JSON and nothing else", async () => {
    fetchMock.mockResolvedValue(json(200, { token: "tok-new", user }));
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    await click("sign in");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/auth/login`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ username: "user1", password: "pw" });
  });

  /* The tenant is derived server-side and returned with the session. A tenant a
     client can claim is not isolation, so nothing here sends one. */
  test("does not send a tenant", async () => {
    fetchMock.mockResolvedValue(json(200, { token: "tok-new", user }));
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    await click("sign in");
    expect(fetchMock.mock.calls[0][1].body).not.toContain("tenant");
  });

  test("a refused sign-in leaves the session anonymous and stores no token", async () => {
    fetchMock.mockResolvedValue(json(401, { error: "Wrong password." }));
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    await click("sign in");
    expect(status()).toBe("anonymous");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("signing out", () => {
  const signedIn = async () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    fetchMock.mockResolvedValue(json(200, { user }));
    mount();
    await waitFor(() => expect(status()).toBe("authenticated"));
    fetchMock.mockClear();
  };

  test("clears the token and the user", async () => {
    await signedIn();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await click("sign out");
    expect(status()).toBe("anonymous");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("-");
  });

  test("tells the server, carrying the token being retired", async () => {
    await signedIn();
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await click("sign out");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/auth/logout`);
    expect(init.headers.Authorization).toBe("Bearer tok-1");
  });

  /* Local first, server second. The demo API being down does not keep someone
     signed in on a machine they are walking away from. */
  test("an unreachable server does not keep the user signed in", async () => {
    await signedIn();
    fetchMock.mockImplementation(() => offline() as unknown as Promise<Response>);
    await click("sign out");
    expect(status()).toBe("anonymous");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("readToken", () => {
  test("reads what was stored, without the caller knowing the key", () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    expect(readToken()).toBe("tok-1");
  });

  /* Private browsing and some embedded webviews throw on access rather than
     returning null. That is signed out, not a crashed shell. */
  test("storage that throws reads as signed out", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(readToken()).toBeNull();
  });

  test("a shell whose storage cannot be written still signs in", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    fetchMock.mockResolvedValue(json(200, { token: "tok-new", user }));
    mount();
    await waitFor(() => expect(status()).toBe("anonymous"));
    await click("sign in");
    /* The session simply will not survive a reload. */
    expect(status()).toBe("authenticated");
  });
});

describe("authedFetch", () => {
  test("attaches the stored bearer and prefixes the API", async () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    fetchMock.mockResolvedValue(json(200, {}));
    await authedFetch("/ai/policy");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/ai/policy`);
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok-1");
  });

  test("sends no Authorization header when there is no token", async () => {
    fetchMock.mockResolvedValue(json(200, {}));
    await authedFetch("/ai/policy");
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("Authorization")).toBeNull();
  });

  test("keeps the caller's own headers and method", async () => {
    window.localStorage.setItem(STORAGE_KEY, "tok-1");
    fetchMock.mockResolvedValue(json(200, {}));
    await authedFetch("/ai/dispatch", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    const headers = new Headers(init.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer tok-1");
  });

  /* A plain Response, not a thrown error: a 401 means the session died
     server-side (an API restart drops every token) and the caller decides. */
  test("hands back the response rather than interpreting it", async () => {
    fetchMock.mockResolvedValue(json(401, {}));
    expect((await authedFetch("/ai/policy")).status).toBe(401);
  });
});

describe("useSession", () => {
  /* A silent fallback would render a shell that looks signed in and can do
     nothing, which is harder to diagnose than a thrown error at the boundary. */
  test("throws outside a provider rather than inventing an empty session", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/SessionProvider/);
    quiet.mockRestore();
  });
});

describe("the demo accounts", () => {
  test("each carries the username the sign-in form posts", () => {
    expect(DEMO_ACCOUNTS.length).toBeGreaterThan(0);
    for (const account of DEMO_ACCOUNTS) {
      expect(account.username).toMatch(/^\S+$/);
      expect(account.label).not.toBe("");
    }
  });

  /* Demo credentials, listed on the sign-in screen. A password among them would
     be a password in the bundle. */
  test("and no password", () => {
    expect(JSON.stringify(DEMO_ACCOUNTS)).not.toMatch(/password|secret|pw\b/i);
  });
});
