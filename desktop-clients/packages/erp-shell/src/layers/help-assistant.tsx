"use client";

import React from "react";
import { BookOpen, CircleHelp, Keyboard, WandSparkles } from "lucide-react";
import { Button, Modal } from "@pepbits/ops-ui";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "../erp-context";

export function HelpAssistant() {
  const { preferences, helpOpen, setHelpOpen, setDocumentationOpen } = useERP();
  const navigation = useNavigation();
  const page = PAGE_REGISTRY[navigation.current.pageId];
  if (!preferences.helperEnabled) return null;
  const steps = page?.kind === "worklist"
    ? ["Use the global search for any visible value.", "Open Advanced filters only when you need precise criteria.", "Choose table or cards, then preview, view or edit a record."]
    : page?.kind === "form"
      ? ["Complete the active form section.", "Use the rail, tabs or wizard selected in My Preferences.", "Validate and save with Alt + S."]
      : ["Review summary indicators and action queues.", "Use the module selector to reset navigation for another domain.", "Press Ctrl/Cmd + K to open any page quickly."];
  return (
    <>
      <button type="button" aria-label="Open page helper" onClick={() => setHelpOpen(true)} className="help-pulse no-print fixed bottom-12 right-5 z-[70] flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5"><CircleHelp className="size-5" /></button>
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title={`${page?.title ?? "Page"} assistant`} subtitle="Interactive guidance generated from the current page type." size="md" footer={<><Button variant="ghost" onClick={() => setHelpOpen(false)}>Close</Button>{preferences.documentationEnabled ? <Button variant="primary" leftIcon={<BookOpen className="size-3.5" />} onClick={() => { setHelpOpen(false); setDocumentationOpen(true); }}>Open documentation</Button> : null}</>}>
        <div className="p-5"><div className="rounded-2xl border border-[color-mix(in_srgb,var(--primary)_24%,var(--border))] bg-[var(--primary-soft)] p-4"><div className="flex items-center gap-2 text-[12px] font-black text-[var(--primary-strong)]"><WandSparkles className="size-4" />Guided workflow</div><p className="mt-1 text-[9.5px] leading-relaxed text-[var(--text-muted)]">Follow these steps to complete the main task on this page.</p></div><div className="mt-4 space-y-2">{steps.map((step, index) => <div key={step} className="flex gap-3 rounded-xl border border-[var(--border)] p-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[9px] font-black">{index + 1}</span><span className="pt-1 text-[10.5px] font-semibold">{step}</span></div>)}</div><div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--surface-2)] p-3 text-[9.5px] text-[var(--text-muted)]"><Keyboard className="size-4 text-[var(--primary)]" /><b className="text-[var(--text)]">Tip:</b> press ? from any non-input area to reopen this helper.</div></div>
      </Modal>
    </>
  );
}
