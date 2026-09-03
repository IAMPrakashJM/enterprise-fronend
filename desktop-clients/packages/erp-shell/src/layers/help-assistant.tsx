"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, CircleHelp, Keyboard, Pause, Play, Route, X } from "lucide-react";
import { Button, IconButton, cn } from "@pepbits/ops-ui";
import { HOTKEYS, PAGE_REGISTRY, TOURS } from "@pepbits/erp-config";
import type { TourStep } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "../erp-context";

/** Fired before a step is measured. A page whose anchors sit behind tabs (the
    preferences page) listens and reveals the one named, so the tour can reach
    every section rather than only the tab that happens to be open. */
export const TOUR_REVEAL_EVENT = "nexora:tour-reveal";

type Spot = { x: number; y: number; w: number; h: number };
type Tab = "tour" | "docs" | "keys";

/* Steps whose anchor is not on the page are dropped up front, so "1 / 3" is
   honest and Play never parks on a blank spotlight. */
function presentSteps(steps: TourStep[]): TourStep[] {
  if (typeof document === "undefined") return steps;
  return steps.filter((step) => document.querySelector(`[data-tour="${step.target}"]`));
}

function Spotlight({ spot, title }: { spot: Spot; title: string }) {
  return (
    <>
      {/* The dim is the shadow: one element with a 9999px box-shadow darkens
          everything except its own box, with no second overlay to z-order. */}
      <div aria-hidden className="pointer-events-none fixed z-[65] rounded-xl border-2 border-[var(--primary)] transition-all duration-300"
        style={{ left: spot.x, top: spot.y, width: spot.w, height: spot.h, boxShadow: "0 0 0 9999px rgba(0,0,0,.38)" }} />
      <div aria-hidden className="pointer-events-none fixed z-[66] rounded-lg bg-[var(--primary)] px-2 py-0.5 text-[length:calc(10.5px*var(--fs-scale))] font-bold text-white shadow-[var(--shadow-md)] transition-all duration-300"
        style={{ left: spot.x, top: spot.y + spot.h + 8 }}>{title}</div>
    </>
  );
}

export function HelpAssistant() {
  const { preferences, helpOpen, setHelpOpen, setDocumentationOpen } = useERP();
  const navigation = useNavigation();
  const page = PAGE_REGISTRY[navigation.current.pageId];
  const kind = page?.kind ?? "dashboard";

  const [tab, setTab] = useState<Tab>("tour");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);

  /* Resolved when the panel opens or the page changes, never during render:
     the filter reads the DOM, and the anchors it looks for are painted by the
     same commit this component is part of. */
  useEffect(() => {
    if (!helpOpen) return;
    const all = TOURS[kind] ?? TOURS.default;
    const present = presentSteps(all);
    setSteps(present.length ? present : presentSteps(TOURS.default));
    setStep(0);
    setPlaying(false);
  }, [helpOpen, kind, navigation.current.pageId]);

  const current = steps[Math.min(step, Math.max(0, steps.length - 1))];

  const measure = useCallback(() => {
    if (tab !== "tour" || !current) { setSpot(null); return; }
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    if (!el) { setSpot(null); return; }
    const r = el.getBoundingClientRect();
    setSpot({ x: r.left - 6, y: r.top - 6, w: r.width + 12, h: r.height + 12 });
  }, [current, tab]);

  /* Reveal, scroll, then measure. The reveal may switch a tab and the scroll
     may animate, so the measurement waits for both; resize and scroll keep it
     pinned to the element afterwards. */
  useEffect(() => {
    if (!helpOpen || tab !== "tour" || !current) { setSpot(null); return; }
    window.dispatchEvent(new CustomEvent(TOUR_REVEAL_EVENT, { detail: { target: current.target } }));
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    el?.scrollIntoView({ block: "center", inline: "nearest", behavior: preferences.reducedMotion ? "auto" : "smooth" });
    const timer = window.setTimeout(measure, preferences.reducedMotion ? 80 : 320);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current, helpOpen, measure, preferences.reducedMotion, tab]);

  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % steps.length), 4000);
    return () => window.clearInterval(id);
  }, [playing, steps.length]);

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setHelpOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, setHelpOpen]);

  const tabs = useMemo(() => [
    { id: "tour" as Tab, label: "Tour", icon: <Route className="size-3.5" /> },
    { id: "docs" as Tab, label: "Docs", icon: <BookOpen className="size-3.5" /> },
    { id: "keys" as Tab, label: "Shortcuts", icon: <Keyboard className="size-3.5" /> },
  ], []);

  if (!preferences.helperEnabled) return null;

  return (
    <>
      <button type="button" aria-label="Open page helper" title="Help (?)" onClick={() => setHelpOpen(!helpOpen)}
        className="help-pulse no-print fixed bottom-12 right-5 z-[70] flex size-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-[var(--shadow-md)] transition hover:-translate-y-0.5">
        <CircleHelp className="size-5" />
      </button>

      {helpOpen ? (
        <div role="dialog" aria-label="Help" className="animate-slide-up no-print fixed bottom-28 right-5 z-[71] flex max-h-[70vh] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="flex border-b border-[var(--border)]">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => { setTab(item.id); setPlaying(false); }}
                className={cn("focus-ring flex h-10 flex-1 items-center justify-center gap-1.5 border-b-2 text-[length:calc(11px*var(--fs-scale))] font-bold transition",
                  tab === item.id ? "border-[var(--primary)] text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]")}>
                {item.icon}{item.label}
              </button>
            ))}
            <IconButton label="Close help" className="size-10 rounded-none" onClick={() => setHelpOpen(false)}><X className="size-4" /></IconButton>
          </div>

          {tab === "tour" ? (
            <div className="nex-scrollbar flex flex-col gap-3 overflow-auto px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.12em] text-[var(--text-muted)]">Guided tour · {page?.title ?? "Workspace"}</span>
                <span className="flex-1" />
                <span className="font-mono text-[length:calc(10.5px*var(--fs-scale))] tabular-nums text-[var(--text-muted)]">{steps.length ? step + 1 : 0} / {steps.length}</span>
              </div>
              <div className="h-[3px] overflow-hidden rounded-sm bg-[var(--surface-3)]"><div className="h-full bg-[var(--primary)] transition-[width] duration-300" style={{ width: `${steps.length ? ((step + 1) / steps.length) * 100 : 0}%` }} /></div>
              {current ? (
                <div className="flex min-h-[90px] items-start gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] font-mono text-[length:calc(11px*var(--fs-scale))] font-black text-white">{step + 1}</span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[length:calc(12px*var(--fs-scale))] font-black">{current.title}</span>
                    <span className="text-[length:calc(10.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{current.text}</span>
                  </span>
                </div>
              ) : <div className="rounded-xl bg-[var(--surface-2)] p-3 text-[length:calc(10.5px*var(--fs-scale))] text-[var(--text-muted)]">Nothing to tour on this page yet.</div>}
              <div className="flex gap-1.5">{steps.map((s, i) => <button key={s.target} type="button" title={s.title} onClick={() => setStep(i)} className={cn("h-2 flex-1 rounded-sm transition", i <= step ? "bg-[var(--primary)]" : "bg-[var(--border)]")} />)}</div>
              <div className="flex items-center gap-2">
                <Button variant={playing ? "secondary" : "primary"} size="sm" leftIcon={playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />} onClick={() => setPlaying((p) => !p)} disabled={steps.length < 2}>{playing ? "Pause" : "Play tour"}</Button>
                <span className="flex-1" />
                <IconButton label="Previous step" onClick={() => setStep((s) => (s - 1 + steps.length) % steps.length)} disabled={!steps.length}><ChevronLeft className="size-4" /></IconButton>
                <IconButton label="Next step" onClick={() => setStep((s) => (s + 1) % steps.length)} disabled={!steps.length}><ChevronRight className="size-4" /></IconButton>
              </div>
            </div>
          ) : null}

          {tab === "docs" ? (
            <div className="nex-scrollbar flex flex-col gap-2.5 overflow-auto px-4 py-3.5">
              <span className="text-[length:calc(12px*var(--fs-scale))] font-black">{page?.title ?? "Workspace"}</span>
              <span className="text-[length:calc(10.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{page?.subtitle ?? "Rendered from the central page registry using the shared shell, theme, access and preference contracts."}</span>
              <span className="border-t border-[var(--border)] pt-2.5 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">The full page guide, the component library and the developer manual are one click away.</span>
              <div className="flex flex-wrap gap-2">
                {preferences.documentationEnabled ? <Button size="sm" variant="primary" leftIcon={<BookOpen className="size-3.5" />} onClick={() => { setHelpOpen(false); setDocumentationOpen(true); }}>Open documentation</Button> : null}
                <Button size="sm" variant="secondary" onClick={() => { navigation.open({ pageId: "library-dashboard" }); setHelpOpen(false); }}>Open Library →</Button>
              </div>
            </div>
          ) : null}

          {tab === "keys" ? (
            <div className="nex-scrollbar flex flex-col overflow-auto px-4 pb-3.5 pt-2">
              {HOTKEYS.map((h) => (
                <div key={h.keys} className="flex items-center justify-between border-b border-[var(--border)] py-2 text-[length:calc(10.5px*var(--fs-scale))]">
                  <span className="font-semibold">{h.what}</span>
                  <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[length:calc(9.5px*var(--fs-scale))] font-bold text-[var(--text-muted)]">{h.keys}</kbd>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {helpOpen && tab === "tour" && spot && current ? <Spotlight spot={spot} title={current.title} /> : null}
    </>
  );
}
