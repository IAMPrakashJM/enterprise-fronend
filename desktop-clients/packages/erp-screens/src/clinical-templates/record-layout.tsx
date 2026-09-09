"use client";
import React, { useEffect, useRef, useId, type ReactNode } from "react";
import { Button, useLocalization } from "@pepbits/ops-ui";
import type { UserPreferences } from "@pepbits/erp-config";
import styles from "./record-layout.module.css";

/** Presentation slots keep this long-record layout reusable outside patient registration. */
export function RecordSectionLayout<T extends { id: string; title: string }>({
  sections,
  active,
  onActive,
  preferences,
  isDone,
  identity,
  railHeader,
  footer,
  renderSection,
}: {
  sections: T[];
  active: string;
  onActive: (id: string) => void;
  preferences: UserPreferences;
  isDone: (id: string) => boolean;
  identity?: ReactNode;
  railHeader: ReactNode;
  footer: ReactNode;
  renderSection: (section: T) => ReactNode;
}) {
  const instance = useId();
  const { t, direction } = useLocalization(),
    content = useRef<HTMLDivElement>(null),
    observed = useRef(active);
  const layout = preferences.formNavigation,
    count = sections.filter((s) => isDone(s.id)).length;
  const go = (id: string) => {
    observed.current = id;
    onActive(id);
    if (layout === "rail")
      content.current
        ?.querySelector<HTMLElement>(`[data-record-section="${id}"]`)
        ?.scrollIntoView?.({
          block: "start",
          behavior: preferences.reducedMotion ? "instant" : "smooth",
        });
  };
  useEffect(() => {
    if (layout === "rail" && observed.current !== active) go(active);
  }, [active, layout]);
  const step = (s: T, i: number) => (
    <Button
      key={s.id}
      role="tab"
      aria-label={t(s.title)}
      aria-selected={active === s.id}
      id={`${instance}-tab-${s.id}`}
      tabIndex={active === s.id ? 0 : -1}
      aria-controls={
        layout === "rail" || active === s.id
          ? `${instance}-section-${s.id}`
          : undefined
      }
      onKeyDown={(e) => {
        let next = i;
        if (e.key === "Home") next = 0;
        else if (e.key === "End") next = sections.length - 1;
        else if (
          e.key === "ArrowDown" ||
          e.key === (direction === "rtl" ? "ArrowLeft" : "ArrowRight")
        )
          next = (i + 1) % sections.length;
        else if (
          e.key === "ArrowUp" ||
          e.key === (direction === "rtl" ? "ArrowRight" : "ArrowLeft")
        )
          next = (i - 1 + sections.length) % sections.length;
        else return;
        e.preventDefault();
        go(sections[next].id);
        document
          .getElementById(`${instance}-tab-${sections[next].id}`)
          ?.focus();
      }}
      variant="ghost"
      className={styles.step}
      data-active={active === s.id}
      onClick={() => go(s.id)}
    >
      <span className={styles.number} data-done={isDone(s.id)}>
        {isDone(s.id) && (layout !== "wizard" || active !== s.id)
          ? "✓"
          : layout === "wizard"
            ? i + 1
            : String(i + 1).padStart(2, "0")}
      </span>
      {layout !== "wizard" || active === s.id ? (
        <span>{t(s.title)}</span>
      ) : null}
    </Button>
  );
  return (
    <div
      className={styles.surface}
      data-layout={layout}
      data-density={preferences.density}
      data-motion={preferences.reducedMotion ? "reduced" : "full"}
    >
      {identity ? <div className={styles.identity}>{identity}</div> : null}
      <div className={styles.body}>
        {layout === "rail" ? (
          <nav
            className={styles.rail}
            aria-label={t("template.clinical.sections")}
          >
            <div className={styles.railHead}>{railHeader}</div>
            <div
              role="tablist"
              aria-orientation="vertical"
              className={styles.steps}
            >
              {sections.map(step)}
            </div>
            <div className={styles.meter}>
              <div>
                {t("template.clinical.completion")}{" "}
                <b>{Math.round((count / sections.length) * 100)}%</b>
              </div>
              <progress
                max={sections.length}
                value={count}
                aria-label={t("template.clinical.completion")}
              />
              <small>
                {t("template.clinical.completeCount", {
                  count,
                  total: sections.length,
                })}
              </small>
            </div>
          </nav>
        ) : null}
        <div className={styles.main}>
          {layout !== "rail" ? (
            <div
              className={`${styles.tabs} ${layout === "wizard" ? styles.wizard : ""}`}
              role="tablist"
            >
              {sections.map(step)}
            </div>
          ) : null}
          <div
            ref={content}
            className={styles.content}
            onScroll={() => {
              if (layout !== "rail" || !content.current) return;
              const top = content.current.getBoundingClientRect().top;
              const nodes = Array.from(
                content.current.querySelectorAll<HTMLElement>(
                  "[data-record-section]",
                ),
              );
              const nearest =
                nodes
                  .filter((n) => n.getBoundingClientRect().top <= top + 90)
                  .at(-1) ?? nodes[0];
              const id = nearest?.dataset.recordSection;
              if (id && id !== active) {
                observed.current = id;
                onActive(id);
              }
            }}
          >
            {sections
              .filter((s) => layout === "rail" || s.id === active)
              .map((s) => (
                <section
                  key={s.id}
                  id={`${instance}-section-${s.id}`}
                  aria-labelledby={`${instance}-tab-${s.id}`}
                  data-record-section={s.id}
                  className={styles.section}
                >
                  {renderSection(s)}
                </section>
              ))}
          </div>
        </div>
      </div>
      <footer className={styles.footer}>{footer}</footer>
    </div>
  );
}
