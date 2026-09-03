"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button, cn } from "@pepbits/ops-ui";
import type { AiReply } from "@pepbits/ai-client";
import { useAssistant } from "./use-assistant.ts";

/**
 * One use case, one click, the answer in place.
 *
 * Renders nothing when the named use case is not in `assistant.useCases`. It
 * does not resolve access itself — it asks the shared engine whether this id
 * survived the gates, which is why a use case removed at any gate vanishes from
 * here at the same moment it vanishes from the panel and the terminal.
 *
 * There is no review stage: the affordance names one use case whose `reads` are
 * fixed and inspectable in the panel, and a confirmation on every click of a
 * button whose scope never changes is a dialog people learn to dismiss. A
 * clinical use case is never surfaced this way.
 */
export function InlineAiAction({ useCaseId, label, className }: { useCaseId: string; label?: string; className?: string }) {
  const assistant = useAssistant();
  const [reply, setReply] = useState<AiReply | null>(null);
  const [fieldCount, setFieldCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const useCase = assistant.useCases.find((candidate) => candidate.id === useCaseId);
  if (!assistant.allowed || !useCase || useCase.category === "clinical") return null;

  const go = async () => {
    setBusy(true);
    const { context, reply: answer } = await assistant.run(useCase);
    setFieldCount(context.fields.length);
    setReply(answer);
    setBusy(false);
  };

  return (
    <>
      <Button size="xs" variant="secondary" className={cn(className)} loading={busy}
        leftIcon={<Sparkles className="size-3" />} onClick={() => void go()}>
        {label ?? useCase.label}
      </Button>

      {reply ? (
        <div className="animate-slide-up mt-2 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="flex items-start gap-2">
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <b className="text-[length:calc(10px*var(--fs-scale))]">{useCase.label}</b>
                <span className="text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-muted)]">
                  {fieldCount} field{fieldCount === 1 ? "" : "s"} captured{reply.via === "mock" ? " · mock transport" : ""}
                </span>
              </span>
              <pre className="mt-1.5 whitespace-pre-wrap break-words font-sans text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{reply.text ?? reply.error}</pre>
            </span>
            <button type="button" aria-label="Dismiss" onClick={() => setReply(null)}
              className="focus-ring shrink-0 rounded-md p-1 text-[var(--text-subtle)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]">
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
