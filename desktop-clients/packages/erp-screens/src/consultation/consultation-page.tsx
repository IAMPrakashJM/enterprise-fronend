"use client";
import { CardGrid } from "@pepbits/ops-ui";
import { Card } from "@pepbits/ops-ui";
import { LocalizedText, useLocalization } from "@pepbits/ops-ui";


import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, FileSignature, Layers, Plus, RotateCcw, Sparkles, Stethoscope, TriangleAlert, X } from "lucide-react";
import {
  COMBINATION_COUNT, CONDITIONS, CONSULTATION_TYPES, PATIENT_CONTEXTS, SPECIALTIES, composeConsultation,
} from "@pepbits/erp-config";
import { EM_ELEMENTS, candidateLine, codesFor, deriveFromMdm, deriveFromTime, ordersFor, timeBandsFor } from "@pepbits/erp-config";
import { usePublishAiSources } from "@pepbits/ai-client";
import { TransparencyPanel, useAssistant } from "@pepbits/ai-ui";
import { useRecordEditor, useRecordField, RecordSaveStatus } from "../records/use-record-editor";
import type { RecordEditor } from "@pepbits/erp-data";
import type { NavigationTarget } from "@pepbits/platform-ports";
import { ConsultationRecorder } from "./recorder";
import type { ConsultationOption, EmElementLevel, EmPatientType, PageDefinition } from "@pepbits/erp-config";
import { useERP } from "@pepbits/erp-shell";
import { Badge, Button, Checkbox, IconButton, Input, Radio, Textarea, cn } from "@pepbits/ops-ui";

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
      <span className="block pe-5 text-[length:calc(11px*var(--fs-scale))] font-extrabold text-[var(--text)]"><LocalizedText message={option.label} /></span>
      <span className="mt-1 block text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message={option.summary} /></span>
    </button>
  );
}

function Section({ id, index, title, subtitle, source, required, children }: {
  id: string; index: string; title: string; subtitle: string; source: string; required: boolean; children?: React.ReactNode;
}) {
  const {t} = useLocalization();
  return (
    <Card shadow="none" as="section" id={`sec-${id}`} className="mb-3 overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[length:calc(9px*var(--fs-scale))] font-black text-[var(--primary-strong)]">{index}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[length:calc(11px*var(--fs-scale))] font-extrabold"><LocalizedText message={title} /></span>
          <span className="block text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]"><LocalizedText message={subtitle} /></span>
        </span>
        {/* Which layer put this here. */}
        <Badge tone="neutral">{source.split(" · ").map(part => t(part)).join(" · ")}</Badge>
        {required ? <Badge tone="danger"><LocalizedText message="ui.required.d0a36305" /></Badge> : null}
      </div>
      {children ? <div className="p-3">{children}</div> : null}
    </Card>
  );
}

interface ConsultationValues {
  selection: Selection; step: number; built: boolean; chosenPrompts: string[];
  values: Record<string, string>; coding: "none" | "em";
  em: { problems: EmElementLevel; data: EmElementLevel; risk: EmElementLevel; patient: EmPatientType; minutes: string; basis: "mdm" | "time" };
  codes: string[]; orders: string[]; checks: Record<string, boolean>;
}
const INITIAL_CONSULTATION: ConsultationValues = {
  selection: { type: "new", specialty: "cardiology", condition: "acute", context: "adult" },
  step: 0, built: false, chosenPrompts: [], values: {}, coding: "none",
  em: { problems: "moderate", data: "moderate", risk: "moderate", patient: "new", minutes: "", basis: "mdm" },
  codes: [], orders: [], checks: {},
};
const ConsultationContext = createContext<RecordEditor<ConsultationValues> | null>(null);
function CheckLine({ fieldKey, children }: { fieldKey: string; children: React.ReactNode }) {
  const editor = useContext(ConsultationContext)!;
  const [checks, setChecks] = useRecordField(editor, "checks");
  // Keep the existing persisted identifier independent of the translated caption.
  const key = fieldKey;
  return <label className="flex items-center gap-2 py-1 text-[length:calc(10px*var(--fs-scale))] text-[var(--text-muted)]">
    <Checkbox checked={checks[key] ?? false} onChange={event => setChecks(previous => ({ ...previous, [key]: event.target.checked }))} />{children}
  </label>;
}
export function ConsultationPage(props: { page: PageDefinition; target?: NavigationTarget }) {
  return <ConsultationEditor key={`${props.page.id}:${props.target?.recordId ?? "current"}`} {...props} />;
}
function ConsultationEditor({ page, target }: { page: PageDefinition; target?: NavigationTarget }) {
  const {t: translateCopy} = useLocalization();
  const { toast } = useERP();
  const record = useRecordEditor(`consultation:${page.id}:${target?.recordId ?? "current"}`, INITIAL_CONSULTATION);
  const [selection, setSelection] = useRecordField(record.editor, "selection");
  const [step, setStep] = useRecordField(record.editor, "step");
  const [built, setBuilt] = useRecordField(record.editor, "built");
  const [chosenPrompts, setChosenPrompts] = useRecordField(record.editor, "chosenPrompts");
  const [values, setValues] = useRecordField(record.editor, "values");
  const [coding, setCoding] = useRecordField(record.editor, "coding");
  const [em, setEm] = useRecordField(record.editor, "em");
  const [codes, setCodes] = useRecordField(record.editor, "codes");
  const [orders, setOrders] = useRecordField(record.editor, "orders");
  const codeCatalogue = useMemo(() => codesFor(selection.specialty), [selection.specialty]);
  const orderCatalogue = useMemo(() => ordersFor(selection.specialty), [selection.specialty]);
  const [assist, setAssist] = useState<{ id: string; reply?: string; sending?: boolean } | null>(null);

  const assistant = useAssistant();


  const assistUseCase = assist ? assistant.useCases.find((u) => u.id === assist.id) : undefined;
  const assistContext = useMemo(
    () => (assistUseCase ? assistant.prepare(assistUseCase) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assistUseCase, assist?.id],
  );

  /* TransparencyPanel keeps Send disabled until the credential status says a
     provider is configured, and that status arrives with the administration
     config — which only AssistantPanel was fetching. Without this the review
     rendered correctly and could never be confirmed. */
  useEffect(() => { if (assist) assistant.loadConfig(); }, [assist, assistant]);

  const runAssist = async () => {
    if (!assistUseCase) return;
    setAssist((a) => (a ? { ...a, sending: true } : a));
    const { reply } = await assistant.run(assistUseCase);
    setAssist((a) => (a ? { ...a, sending: false, reply: reply.text ?? reply.error ?? "No response." } : a));
  };

  /* Codes the reply actually named, matched back against the catalogue. A code
     the model produced that is not in the list is dropped here rather than
     shown -- selection-only has to be enforced on the way back, not just asked
     for on the way out. */
  const proposed = useMemo(() => {
    if (!assist?.reply) return [] as string[];
    const pool = assist.id === "coding.suggest-icd" ? codeCatalogue.map((c) => c.code) : orderCatalogue.map((o) => o.code);
    return pool.filter((code) => assist.reply!.includes(code));
  }, [assist, codeCatalogue, orderCatalogue]);

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
  /* What the assist may read. The clinician's narrative is deliberately not
     published: a coding suggestion does not need free text, and free text is
     where a name ends up. */
  usePublishAiSources("consultation", {
    "page-record": {
      problem: values.problem ?? composed.problemLabel,
      specialty: selection.specialty,
      complaint: selection.condition,
      findings: chosenPrompts.join(", "),
      candidateCodes: candidateLine(codeCatalogue),
      candidateOrders: candidateLine(orderCatalogue),
    },
  });

  const requiredFields = useMemo(
    () => composed.sections.filter((s) => s.required && s.id !== "sign").map((s) => s.id),
    [composed],
  );
  const done = requiredFields.filter((id) => (values[id] ?? "").trim().length > 2);
  const pct = Math.round((done.length / Math.max(requiredFields.length, 1)) * 100);

  const set = (id: string, v: string) => setValues((p) => ({ ...p, [id]: v }));

  const savingControls = <><RecordSaveStatus editor={record.editor} /><div className="flex gap-2 p-2">
    <Button disabled={!record.ready || record.loading || record.busy || !!record.error || !!record.recovery} onClick={() => void record.editor.saveDraft()}><LocalizedText message="ui.save.draft.3de10010" /></Button>
    <Button disabled={!record.ready || record.loading || record.busy || !!record.error || !!record.recovery} onClick={async () => { if (await record.editor.save()) toast({ title: "Consultation saved", message: "Documentation saved. Signing remains a separate workflow.", type: "success" }); }}><LocalizedText message="ui.save.consultation.35cf6ad1" /></Button>
    <Button disabled={!record.ready || record.loading || record.busy || !record.dirty} onClick={() => void record.editor.discard()}><LocalizedText message="ui.discard.consultation.changes.05979a62" /></Button>
  </div></>;
  if (!built) {
    const current = STEPS[step];
    return (
      <div className="nex-scrollbar h-full overflow-y-auto p-4">{savingControls}<fieldset disabled={!record.ready || record.loading || !!record.recovery} className="min-w-0 border-0 p-0">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[length:calc(17px*var(--fs-scale))] font-black tracking-[-.01em]"><LocalizedText message={page.title} /></h1>
              <p className="mt-1 text-[length:calc(10.5px*var(--fs-scale))] text-[var(--text-muted)]"><LocalizedText message="ui.one.screen.composed.from.four.layers.the.same.engine.cov.b49b8112" /></p>
            </div>
            <Badge tone="info">{COMBINATION_COUNT}<LocalizedText message="ui.combinations.762b3ed3" /></Badge>
          </div>

          <div className="mb-4 grid gap-1.5 sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <button key={s.key} type="button" onClick={() => setStep(i)}
                className={cn("focus-ring flex items-center gap-2 rounded-[var(--radius)] border px-2.5 py-2 text-left transition",
                  i === step ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]")}>
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-[length:calc(8.5px*var(--fs-scale))] font-black",
                  i < step ? "bg-[var(--success-fill)] text-white" : i === step ? "bg-[var(--primary-fill)] text-white" : "bg-[var(--surface-3)] text-[var(--text-muted)]")}>
                  {i < step ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[length:calc(10px*var(--fs-scale))] font-bold"><LocalizedText message={s.title} /></span>
                  <span className="block text-[length:calc(8.5px*var(--fs-scale))] text-[var(--text-subtle)]"><LocalizedText message={s.hint} /></span>
                </span>
              </button>
            ))}
          </div>

          <Card shadow="none" tone="muted" className="p-3">
            <div className="mb-2.5 text-[length:calc(11px*var(--fs-scale))] font-extrabold">{step + 1}<LocalizedText message="ui.choose.62778c1f" /><LocalizedText message={current.title} /></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {current.options.map((option) => (
                <Choice key={option.id} option={option} selected={selection[current.key] === option.id}
                  onSelect={() => setSelection((p) => ({ ...p, [current.key]: option.id }))} />
              ))}
            </div>
          </Card>

          {composed.warnings.length ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning-ink)]" />
              <div className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
                <b><LocalizedText message="ui.unusual.combination.allowed.not.blocked.6e1c22ec" /></b>
                <ul className="mt-1 list-disc ps-4">{composed.warnings.map((w) => <li key={w}><LocalizedText message={w} /></li>)}</ul>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">
            <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><LocalizedText message="ui.back.aceb696a" /></Button>
            <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]"><LocalizedText message="ui.step.474a987f" />{step + 1}<LocalizedText message="ui.of.a4282e4b" />{STEPS.length}</span>
            <span className="flex-1" />
            {step < STEPS.length - 1
              ? <Button size="sm" variant="primary" onClick={() => setStep((s) => s + 1)}><LocalizedText message="ui.continue.496267cc" /></Button>
              : <Button size="sm" variant="primary" leftIcon={<Layers className="size-3.5" />} onClick={() => setBuilt(true)}><LocalizedText message="ui.compose.consultation.4403af43" /></Button>}
          </div>
        </div>
      </fieldset>
      </div>
    );
  }

  return (
    <ConsultationContext.Provider value={record.editor}><div className="flex h-full min-h-0 flex-col">{savingControls}<fieldset disabled={!record.ready || record.loading || !!record.recovery} className="flex min-h-0 flex-1 flex-col border-0 p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <Stethoscope className="size-4 text-[var(--primary)]" />
        <span className="min-w-0">
          <span className="block text-[length:calc(11.5px*var(--fs-scale))] font-extrabold">{composed.title.split(" · ").map(part => translateCopy(part)).join(" · ")}</span>
          <span className="block text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">{composed.crumb.split(" → ").map(part => translateCopy(part)).join(" → ")}</span>
        </span>
        <span className="flex-1" />
        <Badge tone={pct === 100 ? "success" : "warning"}>{done.length} / {requiredFields.length}<LocalizedText message="ui.required.1307c284" /></Badge>
        <Button size="sm" variant="secondary" leftIcon={<RotateCcw className="size-3.5" />} onClick={() => { setBuilt(false); setStep(0); }}><LocalizedText message="ui.reconfigure.7458d4f3" /></Button>
        <Button size="sm" variant="primary" leftIcon={<FileSignature className="size-3.5" />}
          onClick={() => toast(pct === 100
            ? { title: "Ready for attestation", message: "In production the signer, version, timestamp and method are captured; later edits become addenda.", type: "success" }
            : { title: "Sign blocked", message: translateCopy("Incomplete: {sections}.",{sections:requiredFields.filter((f) => !done.includes(f)).map((f) => translateCopy(composed.sections.find((s) => s.id === f)?.title ?? f)).join(", ")}), type: "warning" })}><LocalizedText message="ui.review.sign.5fdebe08" /></Button>
      </div>

      {assist && assistUseCase && assistContext ? (
        <CardGrid className="fixed inset-0 z-[80] place-items-center bg-[color-mix(in_srgb,var(--text)_45%,transparent)] p-4" role="dialog" aria-label={translateCopy("ui.review.before.sending.ea5feec7")}>
          <Card shadow="lg" className="flex max-h-[85vh] w-[520px] max-w-full flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
              <Sparkles className="size-4 text-[var(--primary)]" />
              <span className="flex-1 text-[length:calc(11px*var(--fs-scale))] font-extrabold"><LocalizedText message={assistUseCase.label} /></span>
              <IconButton label="ui.cancel.19766ed6" className="size-7" onClick={() => setAssist(null)}><X className="size-4" /></IconButton>
            </div>
            {assist.reply ? (
              <div className="nex-scrollbar min-h-0 overflow-y-auto p-3">
                <pre className="whitespace-pre-wrap break-words font-sans text-[length:calc(10px*var(--fs-scale))] leading-relaxed">{assist.reply}</pre>
                <div className="mt-3 border-t border-[var(--border)] pt-3">
                  <div className="mb-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-bold">
                    {proposed.length ? <LocalizedText message="ui.matched.back.against.the.catalogue.a50c373a" /> : <LocalizedText message="ui.nothing.in.the.reply.matched.the.catalogue.bb0df6b3" />}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {proposed.map((code) => (
                      <button key={code} type="button"
                        onClick={() => {
                          const target = assist.id === "coding.suggest-icd" ? codes : orders;
                          const setter = assist.id === "coding.suggest-icd" ? setCodes : setOrders;
                          if (!target.includes(code)) setter([...target, code]);
                        }}
                        className="focus-ring rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[length:calc(9px*var(--fs-scale))] font-bold transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]">
                        + {code}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[length:calc(8.5px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]"><LocalizedText message="ui.suggestions.only.nothing.is.added.until.you.click.it.and.362de738" /></p>
                </div>
                <Button className="mt-3" size="sm" variant="secondary" onClick={() => setAssist(null)}><LocalizedText message="ui.done.11a6767d" /></Button>
              </div>
            ) : (
              /* The SAME review every clinical use case gets — including the
                 acknowledgement naming the record. Reused rather than rebuilt,
                 so the assist cannot drift into a lighter confirmation. */
              <TransparencyPanel context={assistContext} useCase={assistUseCase} config={assistant.config}
                decidedBy={assistant.decidedBy} sending={assist.sending}
                onCancel={() => setAssist(null)} onConfirm={() => void runAssist()} />
            )}
          </Card>
        </CardGrid>
      ) : null}

      <CardGrid className="min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="nex-scrollbar min-h-0 overflow-y-auto bg-[var(--surface-2)] p-3">
          {composed.warnings.length ? (
            <div className="mb-3 flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning-ink)]" />
              <div className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
                {composed.warnings.map((w) => <div key={w}><LocalizedText message={w} /></div>)}
              </div>
            </div>
          ) : null}

          {composed.sections.map((s) => (
            <Section key={s.id} {...s}>
              {s.id === "overview" ? (
                <div className="text-[length:calc(10px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message={composed.contextNote} /></div>
              ) : s.id === "hpi" ? (
                <div className="grid gap-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {composed.prompts.map((p) => (
                      <button key={p} type="button" onClick={() => setChosenPrompts((c) => c.includes(p) ? c.filter((x) => x !== p) : [...c, p])}
                        className={cn("focus-ring rounded-full border px-2 py-1 text-[length:calc(9px*var(--fs-scale))] transition",
                          chosenPrompts.includes(p) ? "border-[var(--primary)] bg-[var(--primary-soft)] font-bold text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                        <LocalizedText message={p} />
                      </button>
                    ))}
                  </div>
                  <Textarea label="ui.clinician.narrative.bcee8ae9" rows={4} value={values.hpi ?? ""} onChange={(e) => set("hpi", e.target.value)}
                    hint={translateCopy("Safety prompts for {problem} come from governed decision-support content. Record only what was actually assessed.", {problem:translateCopy(composed.problemLabel)})} placeholder="ui.document.the.clinically.relevant.history.record.only.wha.7a60920c" />
                </div>
              ) : s.id === "exam" ? (
                <CardGrid className="gap-2 sm:grid-cols-2">
                  {composed.exam.groups.map((g) => (
                    <Card shadow="none" tone="muted" radius="lg" key={g.title} className="p-2.5">
                      <div className="mb-1 text-[length:calc(10px*var(--fs-scale))] font-extrabold"><LocalizedText message={g.title} /></div>
                      {g.findings.map((f) => <CheckLine key={f} fieldKey={f}><LocalizedText message={f} /></CheckLine>)}
                    </Card>
                  ))}
                </CardGrid>
              ) : s.id === "scores" ? (
                <CardGrid className="gap-2 sm:grid-cols-2">
                  {composed.scores.map((sc) => (
                    <Card shadow="none" tone="muted" radius="lg" key={sc.name} className="p-2.5">
                      <div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold"><LocalizedText message={sc.name} /></div>
                      <div className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message={sc.appliesWhen} /></div>
                    </Card>
                  ))}
                </CardGrid>
              ) : s.id === "assessment" ? (
                <div className="grid gap-2.5">
                  <Input label="ui.primary.problem.4b955b0b" value={values.problem ?? composed.problemLabel} onChange={(e) => set("problem", e.target.value)} />
                  <Textarea label="ui.clinical.reasoning.dc513d72" rows={3} value={values.assessment ?? ""} onChange={(e) => set("assessment", e.target.value)}
                    placeholder="ui.differential.evidence.and.the.relationship.between.probl.5a0bee6b" />
                </div>
              ) : s.id === "recording" ? (
                <ConsultationRecorder onTranscript={(text) => set("hpi", `${(values.hpi ?? "").trim()}${values.hpi ? "\n\n" : ""}${text}`)} />
              ) : s.id === "coding" || s.id === "orders" ? (
                (() => {
                  const coding = s.id === "coding";
                  const catalogue: Array<{ code: string; label: string }> = coding
                    ? codeCatalogue.map((c) => ({ code: c.code, label: c.term }))
                    : orderCatalogue.map((o) => ({ code: o.code, label: `${o.name} · ${o.kind}` }));
                  const picked = coding ? codes : orders;
                  const setPicked = coding ? setCodes : setOrders;
                  const useCaseId = coding ? "coding.suggest-icd" : "orders.suggest";
                  const offered = assistant.allowed && assistant.useCases.some((u) => u.id === useCaseId);
                  return (
                    <CardGrid className="gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]">
                          {picked.length ? `${picked.length} selected` : <LocalizedText message="ui.nothing.selected.yet.09245a71" />}
                        </span>
                        <span className="flex-1" />
                        {/* Offered only where the gates allow it. Its absence is
                            the whole manual path, not a degraded one. */}
                        {offered ? (
                          <Button size="sm" variant="secondary" leftIcon={<Sparkles className="size-3.5" />}
                            onClick={() => setAssist({ id: useCaseId })}><LocalizedText message="ui.suggest.with.ai.ee9ba75a" /></Button>
                        ) : (
                          <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-subtle)]"><LocalizedText message="ui.assistant.not.enabled.here.select.manually.258baf78" /></span>
                        )}
                      </div>

                      {picked.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {picked.map((code) => {
                            const item = catalogue.find((c) => c.code === code);
                            return (
                              <span key={code} className="flex items-center gap-1.5 rounded-full border border-[var(--primary)] bg-[var(--primary-soft)] px-2 py-1 text-[length:calc(9px*var(--fs-scale))] font-bold text-[var(--primary-strong)]">
                                <span className="font-mono">{code}</span> {item?.label}
                                <IconButton label={translateCopy("Remove {item}",{item:code})} className="size-4" onClick={() => setPicked(picked.filter((c) => c !== code))}>
                                  <X className="size-3" />
                                </IconButton>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}

                      <Card shadow="none" tone="muted" radius="lg" className="p-2.5">
                        <div className="mb-1.5 text-[length:calc(9px*var(--fs-scale))] font-bold uppercase tracking-[.06em] text-[var(--text-subtle)]">
                          {coding ? <LocalizedText message="ui.diagnosis.catalogue.fcb17a05" /> : <LocalizedText message="ui.orderable.catalogue.9aad2b70" />} · {selection.specialty}
                        </div>
                        <div className="grid gap-1">
                          {catalogue.filter((c) => !picked.includes(c.code)).map((c) => (
                            <button key={c.code} type="button" onClick={() => setPicked([...picked, c.code])}
                              className="focus-ring flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-[length:calc(9.5px*var(--fs-scale))] transition hover:bg-[var(--surface-3)]">
                              <Plus className="size-3 shrink-0 text-[var(--primary)]" />
                              <span className="font-mono font-bold">{c.code}</span>
                              <span className="min-w-0 truncate text-[var(--text-muted)]">{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </Card>
                    </CardGrid>
                  );
                })()
              ) : s.id === "em" ? (
                <CardGrid className="gap-3">
                  <div className="rounded-lg border border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] p-2.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed">
                    <b><LocalizedText message="ui.this.derives.a.level.from.what.is.already.documented.78e65b86" /></b><LocalizedText message="ui.it.is.not.a.target.a.level.is.supported.by.the.work.that.40a707bf" /><b><LocalizedText message="ui.or.7175517a" /></b><LocalizedText message="ui.total.time.not.by.counting.history.and.examination.bulle.4ca4c59a" /></div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(["mdm", "time"] as const).map((b) => (
                      <button key={b} type="button" onClick={() => setEm((p) => ({ ...p, basis: b }))}
                        className={cn("focus-ring rounded-full border px-2.5 py-1 text-[length:calc(9.5px*var(--fs-scale))] font-bold transition",
                          em.basis === b ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                        {b === "mdm" ? <LocalizedText message="ui.by.decision.making.665d31a2" /> : <LocalizedText message="ui.by.total.time.20ea7bc0" />}
                      </button>
                    ))}
                    <span className="flex-1" />
                    {(["new", "established"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setEm((p) => ({ ...p, patient: t }))}
                        className={cn("focus-ring rounded-full border px-2.5 py-1 text-[length:calc(9.5px*var(--fs-scale))] transition",
                          em.patient === t ? "border-[var(--primary)] bg-[var(--primary-soft)] font-bold text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                        {t}<LocalizedText message="ui.patient.03989434" /></button>
                    ))}
                  </div>

                  {em.basis === "mdm" ? (
                    <CardGrid className="gap-2">
                      {EM_ELEMENTS.map((el) => (
                        <Card shadow="none" tone="muted" radius="lg" key={el.id} className="p-2.5">
                          <div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold"><LocalizedText message={el.label} /></div>
                          <div className="mt-0.5 mb-1.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message={el.hint} /></div>
                          <div className="grid gap-1">
                            {el.options.map((o) => (
                              <label key={o.value} className="flex items-start gap-2 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
                                <Radio className="mt-0.5" name={`em-${el.id}`}
                                  checked={em[el.id] === o.value} onChange={() => setEm((p) => ({ ...p, [el.id]: o.value }))} />
                                <span><b className="capitalize">{o.value}</b> — {o.label}</span>
                              </label>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </CardGrid>
                  ) : (
                    <div className="grid gap-2">
                      <Input label="ui.total.time.on.the.date.of.the.encounter.minutes.da22cb02" type="number" min={0}
                        value={em.minutes} onChange={(e) => setEm((p) => ({ ...p, minutes: e.target.value }))}
                        hint="ui.face.to.face.and.non.face.to.face.time.by.the.reporting.6df1aa8e" />
                      <div className="flex flex-wrap gap-1.5">
                        {timeBandsFor(em.patient).map((b) => (
                          <span key={b.code} className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[length:calc(8.5px*var(--fs-scale))]">
                            {b.min}–{b.max}<LocalizedText message="ui.min.46e2a1c0" />{b.code}
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
                          <Badge tone="neutral">{emResult.basis === "mdm" ? <LocalizedText message="ui.by.decision.making.8638211d" /> : <LocalizedText message="ui.by.time.2af7b471" />}</Badge>
                        </div>
                        <div className="mt-1 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{emResult.explanation}</div>
                      </>
                    ) : (
                      <div className="text-[length:calc(9.5px*var(--fs-scale))] text-[var(--text-muted)]"><LocalizedText message="ui.below.the.lowest.time.band.no.level.is.supported.on.time.6475301f" /></div>
                    )}
                    <div className="mt-2 text-[length:calc(8.5px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]"><LocalizedText message="ui.a.supported.level.not.a.submitted.code.final.selection.r.32ace8f6" /></div>
                  </div>
                </CardGrid>
              ) : s.id === "sign" ? (
                <div className="grid gap-1">
                  <CheckLine fieldKey="I reviewed the clinical content"><LocalizedText message="ui.i.reviewed.the.clinical.content.8bdeac61" /></CheckLine>
                  <CheckLine fieldKey="Orders and medication plan verified"><LocalizedText message="ui.orders.and.medication.plan.verified.fc6f12b4" /></CheckLine>
                  <CheckLine fieldKey="Follow-up and safety-net plan verified"><LocalizedText message="ui.follow.up.and.safety.net.plan.verified.2e5847f1" /></CheckLine>
                </div>
              ) : (
                <Textarea rows={3} value={values[s.id] ?? ""} onChange={(e) => set(s.id, e.target.value)} placeholder={translateCopy(s.subtitle)} />
              )}
            </Section>
          ))}
        </div>

        <aside className="nex-scrollbar min-h-0 overflow-y-auto border-t border-[var(--border)] bg-[var(--surface)] p-3 lg:border-s lg:border-t-0">
          <Card shadow="none" tone="transparent" className="mb-3 p-3">
            <div className="mb-2 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold"><LocalizedText message="ui.documentation.completeness.00bd39d9" /></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "var(--success)" : "var(--primary)" }} />
            </div>
            <div className="mt-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              {done.length}<LocalizedText message="ui.of.a4282e4b" />{requiredFields.length}<LocalizedText message="ui.required.sections.this.measures.whether.the.note.is.fill.d0f288bc" /></div>
          </Card>

          <Card shadow="none" tone="transparent" className="mb-3 p-3">
            <div className="mb-2 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold"><LocalizedText message="ui.how.this.was.composed.a455784c" /></div>
            {[["Type", CONSULTATION_TYPES.find((o) => o.id === selection.type)?.label],
              ["Specialty", SPECIALTIES.find((o) => o.id === selection.specialty)?.label],
              ["Complaint", CONDITIONS.find((o) => o.id === selection.condition)?.label],
              ["Context", PATIENT_CONTEXTS.find((o) => o.id === selection.context)?.label]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2 border-b border-[var(--border)] py-1.5 text-[length:calc(9.5px*var(--fs-scale))] last:border-b-0">
                <span className="text-[var(--text-muted)]">{k}</span><b>{v}</b>
              </div>
            ))}
            <div className="mt-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]">
              {composed.sections.length}<LocalizedText message="ui.sections.ordered.core.type.specialty.complaint.context.e.0417b2b5" /></div>
          </Card>

          <Card shadow="none" tone="transparent" className="mb-3 p-3">
            <div className="mb-1.5 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold"><LocalizedText message="ui.coding.scheme.b7ff20ad" /></div>
            <div className="flex gap-1.5">
              {(["none", "em"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setCoding(c)}
                  className={cn("focus-ring flex-1 rounded-lg border px-2 py-1.5 text-[length:calc(9.5px*var(--fs-scale))] font-bold transition",
                    coding === c ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]")}>
                  {c === "none" ? <LocalizedText message="ui.none.dc937b59" /> : "US E/M"}
                </button>
              ))}
            </div>
            <div className="mt-1.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]"><LocalizedText message="ui.a.tenant.setting.this.tenant.is.configured.for.the.uae.w.9f64c95a" /></div>
          </Card>

          <div className="rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--danger)_25%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] p-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[length:calc(10.5px*var(--fs-scale))] font-extrabold">
              <CircleAlert className="size-3.5 text-[var(--danger-ink)]" /><LocalizedText message="ui.scope.of.this.screen.f2f37b23" /></div>
            <div className="text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message="ui.a.documentation.template.not.clinical.decision.support.p.c2723289" /></div>
          </div>
        </aside>
      </CardGrid>
    </fieldset></div></ConsultationContext.Provider>
  );
}
