"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bot, ChevronLeft, Sparkles, X } from "lucide-react";
import { Badge, Button, IconButton, cn } from "@pepbits/ops-ui";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import { gatesForPage, getUseCase, resolveAi } from "@pepbits/ai-config";
import type { AiConfig, AiContext, AiPolicy, AiUseCase } from "@pepbits/ai-config";
import { assembleContext, dispatchAi, fetchAiConfig, fetchAiPolicy, useAiSources } from "@pepbits/ai-client";
import type { AiReply } from "@pepbits/ai-client";
import { useSession } from "@pepbits/auth";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "@pepbits/erp-shell";
import { TransparencyPanel } from "./transparency.tsx";

type Stage = "choose" | "review" | "answer";

/**
 * The docked assistant.
 *
 * Renders NOTHING unless every gate allows it. That is deliberately a return of
 * null rather than a disabled button: a control the user can see but not use
 * invites them to go looking for the permission, and on most pages the honest
 * answer is that the assistant does not belong there at all.
 */
export function AssistantPanel() {
  const { preferences } = useERP();
  const { user } = useSession();
  const navigation = useNavigation();
  const sources = useAiSources();

  const [open, setOpen] = useState(false);
  const [policy, setPolicy] = useState<AiPolicy | null>(null);
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [chosen, setChosen] = useState<AiUseCase | null>(null);
  const [context, setContext] = useState<AiContext | null>(null);
  const [reply, setReply] = useState<AiReply | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchAiPolicy(user.id).then((value) => { if (!cancelled) setPolicy(value); });
    /* Configuration is fetched only when the panel is opened: it is the
       administrator's surface, and pulling provider and limit data on every
       page load for every user is what §6 separates the two endpoints to
       avoid. */
    if (open) void fetchAiConfig().then((result) => { if (!cancelled) setConfig(result.data ?? null); });
    return () => { cancelled = true; };
  }, [open, user]);

  const page = PAGE_REGISTRY[navigation.current.pageId];
  const access = useMemo(() => {
    if (!page) return null;
    return resolveAi(gatesForPage(policy, { pageId: page.id, module: page.module, build: page.ai }, true));
  }, [page, policy]);

  /* A page change invalidates everything: the use cases differ, and a context
     assembled from the previous page's record must never survive into the
     next one's request. */
  useEffect(() => {
    setStage("choose"); setChosen(null); setContext(null); setReply(null);
  }, [navigation.current.pageId]);

  if (!page || !access?.allowed) return null;

  const useCases = access.useCases.map(getUseCase).filter(Boolean) as AiUseCase[];
  if (useCases.length === 0) return null;

  const choose = (useCase: AiUseCase) => {
    setChosen(useCase);
    setContext(assembleContext(useCase, page.id, sources));
    setStage("review");
  };

  const send = async () => {
    if (!chosen || !context) return;
    setSending(true);
    setReply(await dispatchAi(context, chosen));
    setSending(false);
    setStage("answer");
  };

  return (
    <>
      <button type="button" aria-label="Open the AI assistant" title={`AI assistant — ${useCases.length} available here`}
        onClick={() => setOpen((previous) => !previous)}
        className="no-print fixed bottom-28 right-5 z-[70] flex size-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:border-[var(--primary)]">
        <Sparkles className="size-5" />
      </button>

      {open ? (
        <div role="dialog" aria-label="AI assistant"
          className="animate-slide-up no-print fixed bottom-44 right-5 z-[71] flex max-h-[70vh] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
            {stage !== "choose" ? (
              <IconButton label="Back" className="size-7" onClick={() => { setStage("choose"); setReply(null); }}><ChevronLeft className="size-4" /></IconButton>
            ) : <Bot className="size-4 text-[var(--primary)]" />}
            <span className="min-w-0 flex-1 truncate text-[length:calc(11.5px*var(--fs-scale))] font-extrabold">
              {stage === "choose" ? "AI assistant" : chosen?.label}
            </span>
            <Badge tone="neutral">{page.title}</Badge>
            <IconButton label="Close" className="size-7" onClick={() => setOpen(false)}><X className="size-4" /></IconButton>
          </div>

          {stage === "choose" ? (
            <div className="nex-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
              <p className="mb-2 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
                Enabled here by the <b>{access.decidedBy}</b> gate. You will see exactly what is captured before anything is sent.
              </p>
              <div className="grid gap-2">
                {useCases.map((useCase) => (
                  <button key={useCase.id} type="button" onClick={() => choose(useCase)}
                    className={cn("focus-ring rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition hover:border-[var(--primary)] hover:bg-[var(--surface-2)]")}>
                    <span className="flex items-center gap-2">
                      <span className="text-[length:calc(11px*var(--fs-scale))] font-extrabold">{useCase.label}</span>
                      {useCase.category === "clinical" ? <Badge tone="warning">clinical</Badge> : null}
                    </span>
                    <span className="mt-1 block text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{useCase.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {stage === "review" && chosen && context ? (
            <TransparencyPanel context={context} useCase={chosen} config={config} decidedBy={access.decidedBy}
              sending={sending} onCancel={() => setStage("choose")} onConfirm={() => void send()} />
          ) : null}

          {stage === "answer" ? (
            <div className="nex-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
              {reply?.via === "mock" ? (
                <div className="mb-2 rounded-lg border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-2.5 py-1.5 text-[length:calc(9px*var(--fs-scale))] font-bold text-[var(--text)]">
                  Mock transport — no provider was contacted.
                </div>
              ) : null}
              <pre className="whitespace-pre-wrap break-words font-sans text-[length:calc(10.5px*var(--fs-scale))] leading-relaxed">{reply?.text ?? reply?.error}</pre>
              <Button className="mt-3" size="sm" variant="secondary" onClick={() => setStage("choose")}>Ask something else</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
