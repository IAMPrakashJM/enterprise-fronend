"use client";

import React, { useMemo, useState } from "react";
import { Check, CircleAlert, FileSignature, Layers, RotateCcw, Stethoscope, TriangleAlert } from "lucide-react";
import {
  COMBINATION_COUNT, CONDITIONS, CONSULTATION_TYPES, PATIENT_CONTEXTS, SPECIALTIES, composeConsultation,
} from "@pepbits/erp-config";
import { EM_ELEMENTS, deriveFromMdm, deriveFromTime, timeBandsFor } from "@pepbits/erp-config";
import type { ConsultationOption, EmElementLevel, EmPatientType, PageDefinition } from "@pepbits/erp-config";
import { useERP } from "@pepbits/erp-shell";
import { Badge, Button, Input, Textarea, cn } from "@pepbits/ops-ui";

/**
 * The dynamic consultation engine.
 *
 * Four layers — type, specialty, complaint, patient context — composed at render
 * time into one workspace. 625 combinations from one screen, and the number is
 * the whole argument: 625 hand-built pages drift apart the first time a red flag
 * changes, and the drift lands on whichever of them nobody opens.
 *
 * Two things this deliberately shows that a finished product usually hides:
 *
 * EVERY SECTION NAMES THE LAYER THAT ADDED IT. A clinician asked to fill a field
 * should be able to see why it is in front of them, and a template that cannot
 * answer that is one people work around.
 *
 * INSTRUMENTS ARE OFFERED WITH THEIR CONDITIONS, not as empty inputs. A score on
 * screen is an invitation to complete it; a score labelled with when it applies
 * is a decision. That distinction is the difference between decision support and
 * a form that produces numbers nobody chose.
 */

const STEPS = [
  { key: "type" as const, title: "Consultation type", hint: "visit intent", options: CONSULTATION_TYPES },
  { key: "specialty" as const, title: "Specialty", hint: "clinical template", options: SPECIALTIES },
  { key: "condition" as const, title: "Complaint", hint: "problem context", options: CONDITIONS },
  { key: "context" as const, title: "Patient context", hint: "risk layer", options: PATIENT_CONTEXTS },
];

type Selection = { type: string; specialty: string; condition: string; context: string };

function Choice({ option, selected, onSelect }: { option: ConsultationOption; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={cn("focus-ring relative rounded-[var(--radius)] border p-3 text-left transition",
        selected
          ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] hover:bg-[var(--surface-2)]")}>
      {selected ? <Check className="absolute right-2.5 top-2.5 size-3.5 text-[var(--primary)]" /> : null}
      <span className="block pe-5 text-[length:calc(11px*var(--fs-scale))] font-extrabold text-[var(--text)]">{option.label}</span>
      <span className="mt-1 block text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{option.summary}</span>
    </button>
  );
}

function Section({ id, index, title, subtitle, source, required, children }: {
  id: string; index: string; title: string; subtitle: string; source: string; required: boolean; children?: React.ReactNode;
}) {
  return (
    <section id={`sec-${id}`} className="mb-3 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[length:calc(9px*var(--fs-scale))] font-black text-[var(--primary-strong)]">{index}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[length:calc(11px*var(--fs-scale))] font-extrabold">{title}</span>
          <span className="block text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{subtitle}</span>
        </span>
        {/* Which layer put this here. */}
        <Badge tone="neutral">{source}</Badge>
        {required ? <Badge tone="danger">required</Badge> : null}
      </div>
      {children ? <div className="p-3">{children}</div> : null}
    </section>
  );
}

const CheckLine = ({ children }: { children: React.ReactNode }) => (
  <label className="flex items-center gap-2 py-1 text-[length:calc(10px*var(--fs-scale))] text-[var(--text-muted)]">
    <input type="checkbox" className="accent-[var(--primary)]" />{children}
  </label>
);

export function ConsultationPage({ page }: { page: PageDefinition }) {
  const { toast } = useERP();
  const [selection, setSelection] = useState<Selection>({ type: "new", specialty: "cardiology", condition: "acute", context: "adult" });
  const [step, setStep] = useState(0);
  const [built, setBuilt] = useState(false);
  const [chosenPrompts, setChosenPrompts] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  /* Off by default. A deployment turns it on; see composeConsultation. */
  const [coding, setCoding] = useState<"none" | "em">("none");
  const [em, setEm] = useState<{ problems: EmElementLevel; data: EmElementLevel; risk: EmElementLevel; patient: EmPatientType; minutes: string; basis: "mdm" | "time" }>(
    { problems: "moderate", data: "moderate", risk: "moderate", patient: "new", minutes: "", basis: "mdm" },
  );
  const emResult = useMemo(
    () => (em.basis === "time" ? deriveFromTime(Number(em.minutes), em.patient) : deriveFromMdm(em.problems, em.data, em.risk, em.patient)),
    [em],
  );

  const composed = useMemo(
    () => composeConsultation(selection.type, selection.specialty, selection.condition, selection.context, coding),
    [selection, coding],
  );

  /* Required sections come from the composition, so a layer that adds a required
     section also adds it to the sign gate. Keeping a second list would let the
     two disagree, and the gate is the half that would be wrong. */
  const requiredFields = useMemo(
    () => composed.sections.filter((s) => s.required && s.id !== "sign").map((s) => s.id),
    [composed],
  );
  const done = requiredFields.filter((id) => (values[id] ?? "").trim().length > 2);
  const pct = Math.round((done.length / Math.max(requiredFields.length, 1)) * 100);

  const set = (id: string, v: string) => setValues((p) => ({ ...p, [id]: v }));

  if (!built) {
    const current = STEPS[step];
    return (
      <div className="nex-scrollbar h-full overflow-y-auto p-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[length:calc(17px*var(--fs-scale))] font-black tracking-[-.01em]">{page.title}</h1>
              <p className="mt-1 text-[length:calc(10.5px*var(--fs-scale))] text-[var(--text-muted)]">
                One screen, composed from four layers. The same engine covers every combination without a page per combination.
              </p>
            </div>
            <Badge tone="info">{COMBINATION_COUNT} combinations</Badge>
          </div>

          <div className="mb-4 grid gap-1.5 sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <button key={s.key} type="button" onClick={() => setStep(i)}
                className={cn("focus-ring flex items-center gap-2 rounded-[var(--radius)] border px-2.5 py-2 text-left transition",
                  i === step ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]")}>
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[length:calc(8.5px*var(--fs-scale))] font-black",
                  i < step ? "bg-[var(--success)] text-white" : i === step ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-3)] text-[var(--text-muted)]")}>
                  {i < step ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[length:calc(10px*var(--fs-scale))] font-bold">{s.title}</span>
                  <span className="block text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-subtle)]">{s.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="mb-2.5 text-[length:calc(11px*var(--fs-scale))] font-extrabold">{step + 1}. Choose {current.title.toLowerCase()}</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {current.options.map((option) => (
                <Choice key={option.id} option={option} selected={selection[current.key] === option.id}
                  onSelect={() => setSelection((p) => ({ ...p, [current.key]: option.id }))} />
              ))}
            </div>
          </div>

          {composed.warnings.length ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
              <div className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
                <b>Unusual combination — allowed, not blocked.</b>
                <ul className="mt-1 list-disc ps-4">{composed.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>← Back</Button>
            <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]">Step {step + 1} of {STEPS.length}</span>
            <span className="flex-1" />
            {step < STEPS.length - 1
              ? <Button size="sm" variant="primary" onClick={() => setStep((s) => s + 1)}>Continue →</Button>
              : <Button size="sm" variant="primary" leftIcon={<Layers className="size-3.5" />} onClick={() => setBuilt(true)}>Compose consultation →</Button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <Stethoscope className="size-4 text-[var(--primary)]" />
        <span className="min-w-0">
          <span className="block text-[length:calc(11.5px*var(--fs-scale))] font-extrabold">{composed.title}</span>
          <span className="block text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{composed.crumb}</span>
        </span>
        <span className="flex-1" />
        <Badge tone={pct === 100 ? "success" : "warning"}>{done.length} / {requiredFields.length} required</Badge>
        <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="size-3.5" />} onClick={() => { setBuilt(false); setStep(0); }}>Reconfigure</Button>
        <Button size="sm" variant="primary" leftIcon={<FileSignature className="size-3.5" />}
          onClick={() => toast(pct === 100
            ? { title: "Ready for attestation", message: "In production the signer, version, timestamp and method are captured; later edits become addenda.", type: "success" }
            : { title: "Sign blocked", message: `Incomplete: ${requiredFields.filter((f) => !done.includes(f)).map((f) => composed.sections.find((s) => s.id === f)?.title).join(", ")}.`, type: "warning" })}>
          Review & sign
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="nex-scrollbar min-h-0 overflow-y-auto bg-[var(--surface-2)] p-3">
          {composed.warnings.length ? (
            <div className="mb-3 flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
              <div className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
                {composed.warnings.map((w) => <div key={w}>{w}</div>)}
              </div>
            </div>
          ) : null}

          {composed.sections.map((s) => (
            <Section key={s.id} {...s}>
              {s.id === "overview" ? (
                <div className="text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{composed.contextNote}</div>
              ) : s.id === "hpi" ? (
                <div className="grid gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {composed.prompts.map((p) => (
                      <button key={p} type="button" onClick={() => setChosenPrompts((c) => c.includes(p) ? c.filter((x) => x !== p) : [...c, p])}
                        className={cn("focus-ring rounded-full border px-2 py-1 text-[length:calc(9px*var(--fs-scale))] transition",
                          chosenPrompts.includes(p) ? "border-[var(--primary)] bg-[var(--primary-soft)] font-bold text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <Textarea label="Clinician narrative" rows={4} value={values.hpi ?? ""} onChange={(e) => set("hpi", e.target.value)}
                    hint={composed.safetyNote} placeholder="Document the clinically relevant history. Record only what was assessed." />
                </div>
              ) : s.id === "exam" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {composed.exam.groups.map((g) => (
                    <div key={g.title} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                      <div className="mb-1 text-[length:calc(10px*var(--fs-scale))] font-extrabold">{g.title}</div>
                      {g.findings.map((f) => <CheckLine key={f}>{f}</CheckLine>)}
                    </div>
                  ))}
                </div>
              ) : s.id === "scores" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {composed.scores.map((sc) => (
                    <div key={sc.name} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                      <div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">{sc.name}</div>
                      <div className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{sc.appliesWhen}</div>
                    </div>
                  ))}
                </div>
              ) : s.id === "assessment" ? (
                <div className="grid gap-2.5">
                  <Input label="Primary problem" value={values.problem ?? composed.problemLabel} onChange={(e) => set("problem", e.target.value)} />
                  <Textarea label="Clinical reasoning" rows={3} value={values.assessment ?? ""} onChange={(e) => set("assessment", e.target.value)}
                    placeholder="Differential, evidence, and the relationship between problems." />
                </div>
              ) : s.id === "em" ? (
                <div className="grid gap-3">
                  <div className="rounded-lg border border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-2.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed">
                    <b>This derives a level from what is already documented.</b> It is not a target. A level is supported by the work
                    that was clinically necessary and actually done — raising an element to reach a code is the thing this panel is
                    meant to make visible, not easier. Office and outpatient levels are selected by medical decision making <b>or</b>
                    total time, not by counting history and examination bullets. US CPT guidance; it does not apply to this tenant's
                    UAE billing.
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(["mdm", "time"] as const).map((b) => (
                      <button key={b} type="button" onClick={() => setEm((p) => ({ ...p, basis: b }))}
                        className={cn("focus-ring rounded-full border px-2.5 py-1 text-[length:calc(9.5px*var(--fs-scale))] font-bold transition",
                          em.basis === b ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                        {b === "mdm" ? "By decision making" : "By total time"}
                      </button>
                    ))}
                    <span className="flex-1" />
                    {(["new", "established"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setEm((p) => ({ ...p, patient: t }))}
                        className={cn("focus-ring rounded-full border px-2.5 py-1 text-[length:calc(9.5px*var(--fs-scale))] transition",
                          em.patient === t ? "border-[var(--primary)] bg-[var(--primary-soft)] font-bold text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                        {t} patient
                      </button>
                    ))}
                  </div>

                  {em.basis === "mdm" ? (
                    <div className="grid gap-2">
                      {EM_ELEMENTS.map((el) => (
                        <div key={el.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                          <div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">{el.label}</div>
                          <div className="mt-0.5 mb-1.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{el.hint}</div>
                          <div className="grid gap-1">
                            {el.options.map((o) => (
                              <label key={o.value} className="flex items-start gap-2 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
                                <input type="radio" className="mt-0.5 accent-[var(--primary)]" name={`em-${el.id}`}
                                  checked={em[el.id] === o.value} onChange={() => setEm((p) => ({ ...p, [el.id]: o.value }))} />
                                <span><b className="capitalize">{o.value}</b> — {o.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Input label="Total time on the date of the encounter (minutes)" type="number" min={0}
                        value={em.minutes} onChange={(e) => setEm((p) => ({ ...p, minutes: e.target.value }))}
                        hint="Face-to-face and non-face-to-face time by the reporting practitioner on that date. Do not infer it from how long the record was open." />
                      <div className="flex flex-wrap gap-1.5">
                        {timeBandsFor(em.patient).map((b) => (
                          <span key={b.code} className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[length:calc(8.5px*var(--fs-scale))]">
                            {b.min}–{b.max} min · {b.code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={cn("rounded-lg border p-2.5", emResult ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--surface-2)]")}>
                    {emResult ? (
                      <>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[length:calc(14px*var(--fs-scale))] font-black capitalize">{emResult.level}</span>
                          <Badge tone="info">{emResult.code}</Badge>
                          <Badge tone="neutral">{emResult.basis === "mdm" ? "by decision making" : "by time"}</Badge>
                        </div>
                        <div className="mt-1 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{emResult.explanation}</div>
                      </>
                    ) : (
                      <div className="text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">
                        Below the lowest time band — no level is supported on time alone.
                      </div>
                    )}
                    <div className="mt-2 text-[length:calc(8.5px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]">
                      A supported level, not a submitted code. Final selection rests with the clinician or coder against current
                      guidance, medical necessity and payer rules.
                    </div>
                  </div>
                </div>
              ) : s.id === "sign" ? (
                <div className="grid gap-1">
                  <CheckLine>I reviewed the clinical content</CheckLine>
                  <CheckLine>Orders and medication plan verified</CheckLine>
                  <CheckLine>Follow-up and safety-net plan verified</CheckLine>
                </div>
              ) : (
                <Textarea rows={3} value={values[s.id] ?? ""} onChange={(e) => set(s.id, e.target.value)} placeholder={`${s.subtitle}.`} />
              )}
            </Section>
          ))}
        </div>

        <aside className="nex-scrollbar min-h-0 overflow-y-auto border-t border-[var(--border)] bg-[var(--surface)] p-3 lg:border-s lg:border-t-0">
          <div className="mb-3 rounded-[var(--radius)] border border-[var(--border)] p-3">
            <div className="mb-2 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">Documentation completeness</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "var(--success)" : "var(--primary)" }} />
            </div>
            <div className="mt-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              {done.length} of {requiredFields.length} required sections. This measures whether the note is filled in, not whether it is clinically sufficient — and it is not a billing indicator.
            </div>
          </div>

          <div className="mb-3 rounded-[var(--radius)] border border-[var(--border)] p-3">
            <div className="mb-2 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">How this was composed</div>
            {[["Type", CONSULTATION_TYPES.find((o) => o.id === selection.type)?.label],
              ["Specialty", SPECIALTIES.find((o) => o.id === selection.specialty)?.label],
              ["Complaint", CONDITIONS.find((o) => o.id === selection.condition)?.label],
              ["Context", PATIENT_CONTEXTS.find((o) => o.id === selection.context)?.label]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2 border-b border-[var(--border)] py-1.5 text-[length:calc(9.5px*var(--fs-scale))] last:border-b-0">
                <span className="text-[var(--text-muted)]">{k}</span><b>{v}</b>
              </div>
            ))}
            <div className="mt-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]">
              {composed.sections.length} sections, ordered core → type → specialty → complaint → context. Each names its layer.
            </div>
          </div>

          <div className="mb-3 rounded-[var(--radius)] border border-[var(--border)] p-3">
            <div className="mb-1.5 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">Coding scheme</div>
            <div className="flex gap-1.5">
              {(["none", "em"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCoding(c)}
                  className={cn("focus-ring flex-1 rounded-lg border px-2 py-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-bold transition",
                    coding === c ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                  {c === "none" ? "None" : "US E/M"}
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]">
              A tenant setting. This tenant is configured for the UAE, where E/M levels do not apply, so the default is none.
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--danger)_25%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">
              <CircleAlert className="size-3.5 text-[var(--danger)]" /> Scope of this screen
            </div>
            <div className="text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              A documentation template, not clinical decision support. Prompts describe what a note of this shape usually records; they are not advice, and instruments are offered with the conditions under which they apply rather than as fields to complete.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
