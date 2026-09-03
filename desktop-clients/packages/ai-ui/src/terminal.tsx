"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@pepbits/ops-ui";
import type { AiUseCase } from "@pepbits/ai-config";
import type { Assistant } from "./use-assistant.ts";

interface Line { kind: "in" | "out" | "note" | "error"; text: string }

/**
 * Keyboard-first console.
 *
 * The command list is GENERATED from `assistant.useCases`, never written down
 * here. That is the whole reason terminal mode is not a bypass: it can only
 * name what the gates already allowed, and a use case removed at any gate
 * disappears from `:help` and stops resolving, without this file changing.
 */
export function AiTerminal({ assistant }: { assistant: Assistant }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  /** `id` -> use case, plus a short alias from the last path segment. */
  const commands = useMemo(() => {
    const map = new Map<string, AiUseCase>();
    for (const useCase of assistant.useCases) {
      map.set(useCase.id, useCase);
      const alias = useCase.id.split(".").pop();
      if (alias && !map.has(alias)) map.set(alias, useCase);
    }
    return map;
  }, [assistant.useCases]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines, busy]);

  const push = (line: Line) => setLines((previous) => [...previous, line]);

  const help = () => {
    push({ kind: "note", text: `Enabled here by the ${assistant.decidedBy} gate. ${assistant.useCases.length} command${assistant.useCases.length === 1 ? "" : "s"}:` });
    for (const useCase of assistant.useCases) {
      push({ kind: "note", text: `  :${useCase.id.split(".").pop()}   ${useCase.label} — ${useCase.description}` });
    }
    push({ kind: "note", text: "  :fields <cmd>   show what would be captured, without sending" });
    push({ kind: "note", text: "  :clear          clear the transcript" });
  };

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    push({ kind: "in", text });
    setValue("");

    if (text === ":help" || text === "help" || text === "?") return help();
    if (text === ":clear") return setLines([]);

    if (text.startsWith(":fields")) {
      const name = text.slice(":fields".length).trim().replace(/^:/, "");
      const useCase = commands.get(name);
      if (!useCase) return push({ kind: "error", text: `No such command here: "${name}". Try :help.` });
      const context = assistant.prepare(useCase);
      if (context.fields.length === 0) return push({ kind: "note", text: "Nothing on this page matches what that use case may read." });
      for (const field of context.fields) {
        push({ kind: "note", text: `  ${field.label}: ${field.value}${field.redacted ? "  (redacted)" : ""}  [${field.source}]` });
      }
      return;
    }

    const name = text.startsWith(":") ? text.slice(1).split(/\s+/)[0] : "";
    const useCase = name ? commands.get(name) : undefined;
    if (!useCase) {
      /* Deliberately identical wording whether the command never existed or was
         removed by a gate. "Disabled for your tenant" would tell the user which
         capabilities exist elsewhere, which is not theirs to learn from a
         console. :help lists what they DO have. */
      return push({ kind: "error", text: text.startsWith(":") ? `No such command here: "${name}". Try :help.` : "Commands start with a colon. Try :help." });
    }

    const rest = text.slice(text.indexOf(name) + name.length).trim();
    setBusy(true);
    const { context, reply } = await assistant.run(useCase, rest || undefined);
    setBusy(false);
    push({ kind: "note", text: `${context.fields.length} field${context.fields.length === 1 ? "" : "s"} captured${reply.via === "mock" ? " — mock transport, nothing left this browser" : ""}` });
    push({ kind: reply.ok ? "out" : "error", text: reply.text ?? reply.error ?? "No reply." });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-2)]">
      <div className="nex-scrollbar min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[length:calc(10px*var(--fs-scale))] leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-[var(--text-muted)]">Type <b className="text-[var(--text)]">:help</b> for the commands available on this page.</p>
        ) : null}
        {lines.map((line, index) => (
          <pre key={index} className={cn("whitespace-pre-wrap break-words",
            line.kind === "in" && "text-[var(--primary-strong)]",
            line.kind === "note" && "text-[var(--text-muted)]",
            line.kind === "error" && "text-[var(--danger)]",
          )}>{line.kind === "in" ? `> ${line.text}` : line.text}</pre>
        ))}
        {busy ? <pre className="text-[var(--text-muted)]">working…</pre> : null}
        <div ref={endRef} />
      </div>
      <form className="flex shrink-0 items-center gap-2 border-t border-[var(--border)] px-3 py-2"
        onSubmit={(event) => { event.preventDefault(); void submit(value); }}>
        <span className="font-mono text-[length:calc(11px*var(--fs-scale))] text-[var(--primary)]">&gt;</span>
        <input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)}
          disabled={busy} aria-label="Assistant command" placeholder=":help"
          className="focus-ring min-w-0 flex-1 bg-transparent font-mono text-[length:calc(10.5px*var(--fs-scale))] text-[var(--text)] outline-none placeholder:text-[var(--text-subtle)]" />
      </form>
    </div>
  );
}
