"use client";

import { authedFetch } from "@pepbits/auth";
import type { AiPolicy } from "@pepbits/ai-config";

/**
 * The runtime gates, fetched once per session and cached.
 *
 * Cached in a module-level promise rather than component state: every allowed
 * page asks the same question, and a fetch per page mount would put the policy
 * on the critical path of every navigation.
 *
 * A failure resolves to `null`, not to a denial. The deny-on-missing-policy
 * decision belongs to the SERVER, which returns platform:{allowed:false} for an
 * unknown tenant. A client that failed closed on a network blip would make the
 * assistant vanish intermittently, which teaches people to distrust the gating
 * rather than the network — and it would not be a security gain, because the
 * client resolver decides what to RENDER and the server re-checks at dispatch.
 */
let inflight: Promise<AiPolicy | null> | null = null;
let cached: AiPolicy | null = null;
let owner: string | null = null;

export function fetchAiPolicy(userId: string): Promise<AiPolicy | null> {
  /* Keyed by user, so signing in as someone else cannot inherit the previous
     account's policy out of a module-level cache. */
  if (owner !== userId) {
    owner = userId;
    cached = null;
    inflight = null;
  }
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = (async () => {
      try {
        const response = await authedFetch("/ai/policy");
        if (!response.ok) return null;
        cached = (await response.json()) as AiPolicy;
        return cached;
      } catch {
        return null;
      } finally {
        inflight = null;
      }
    })();
  }
  return inflight;
}

/** Drops the cache. Called on sign-out, and after an administrator saves. */
export function resetAiPolicy(): void {
  cached = null;
  inflight = null;
  owner = null;
}
