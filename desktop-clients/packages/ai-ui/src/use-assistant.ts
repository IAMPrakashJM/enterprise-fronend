"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import { gatesForPage, getUseCase, resolveAi } from "@pepbits/ai-config";
import type { AiConfig, AiContext, AiPolicy, AiUseCase, Gate } from "@pepbits/ai-config";
import { assembleContext, dispatchAi, fetchAiConfig, fetchAiPolicy, useAiSources } from "@pepbits/ai-client";
import type { AiReply } from "@pepbits/ai-client";
import { useSession } from "@pepbits/auth";
import { useNavigation } from "@pepbits/platform-ports";

/**
 * The engine behind every mode.
 *
 * Panel, terminal and inline action are three affordances over THIS, not three
 * implementations of the same idea. That is what makes the guarantee testable:
 * remove a use case at any gate and it disappears from all three at once,
 * because all three enumerate the same `useCases` array. A surface that
 * resolved its own would eventually disagree, and the one that disagreed would
 * be the one nobody checked.
 *
 * No component below may call `resolveAi` or `getUseCase` itself.
 */
export interface Assistant {
  /** Null when there is no page, or the page is not in the registry. */
  allowed: boolean;
  /** The gate that decided — shown to the user and written to the audit. */
  decidedBy: Gate;
  reason: string;
  /** The resolved set, already narrowed by every gate. THE list. */
  useCases: AiUseCase[];
  pageId: string;
  pageTitle: string;
  config: AiConfig | null;
  /** Assemble for one use case without sending. What the panel reviews. */
  prepare: (useCase: AiUseCase, userInput?: string) => AiContext;
  /** Assemble and send in one step, for surfaces with no review stage. */
  run: (useCase: AiUseCase, userInput?: string) => Promise<{ context: AiContext; reply: AiReply }>;
  /** Loads the administration config; called when a surface opens. */
  loadConfig: () => void;
}

export function useAssistant(): Assistant {
  const { user } = useSession();
  const navigation = useNavigation();
  const sources = useAiSources();
  const [policy, setPolicy] = useState<AiPolicy | null>(null);
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [wantConfig, setWantConfig] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchAiPolicy(user.id).then((value) => { if (!cancelled) setPolicy(value); });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!wantConfig) return;
    let cancelled = false;
    /* Fetched on demand, not on every page load: it is the administrator's
       surface, and §6 separates the two endpoints precisely so provider and
       limit data do not ride along with every navigation. */
    void fetchAiConfig().then((result) => { if (!cancelled) setConfig(result.data ?? null); });
    return () => { cancelled = true; };
  }, [wantConfig]);

  const pageId = navigation.current.pageId;
  const page = PAGE_REGISTRY[pageId];

  const access = useMemo(() => {
    if (!page) return { allowed: false, decidedBy: "build" as Gate, reason: "Unknown page.", useCases: [] as string[] };
    return resolveAi(gatesForPage(policy, { pageId: page.id, module: page.module, build: page.ai }, true));
  }, [page, policy]);

  const useCases = useMemo(
    () => access.useCases.map(getUseCase).filter(Boolean) as AiUseCase[],
    [access.useCases],
  );

  const prepare = useCallback(
    (useCase: AiUseCase, userInput?: string) => assembleContext(useCase, pageId, sources, userInput),
    [pageId, sources],
  );

  const run = useCallback(async (useCase: AiUseCase, userInput?: string) => {
    const context = assembleContext(useCase, pageId, sources, userInput);
    return { context, reply: await dispatchAi(context, useCase) };
  }, [pageId, sources]);

  return {
    allowed: access.allowed && useCases.length > 0,
    decidedBy: access.decidedBy,
    reason: access.reason,
    useCases,
    pageId,
    pageTitle: page?.title ?? "Workspace",
    config,
    prepare,
    run,
    loadConfig: useCallback(() => setWantConfig(true), []),
  };
}
