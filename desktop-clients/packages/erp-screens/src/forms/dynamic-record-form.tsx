"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Copy, Eye, FileCheck2, History, LockKeyhole, MoreHorizontal, Pencil, RotateCcw, Save, Send, ShieldCheck, Sparkles } from "lucide-react";
import { getEntitySchema } from "@pepbits/erp-config";
import { getWorklistConfig } from "@pepbits/erp-data";
import { usePublishAiSources } from "@pepbits/ai-client";
import { useERP } from "@pepbits/erp-shell";
import { Button, IconButton } from "@pepbits/ops-ui";
import { Badge } from "@pepbits/ops-ui";
import { Card } from "@pepbits/ops-ui";
import { Input, MultiSelect, Select, Textarea, Toggle } from "@pepbits/ops-ui";
import { ActionMenu, MenuButton } from "@pepbits/ops-ui";
import { cn } from "@pepbits/ops-ui";
import type { FormFieldSchema, PageDefinition } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import type { NavigationTarget } from "@pepbits/platform-ports";
import { FormNavigationControl } from "./form-navigation";

function buildInitialValues(page: PageDefinition, recordId?: string) {
  const schema = getEntitySchema(page.entity, page.title);
  const values: Record<string, string | number | boolean | string[]> = {};
  schema.sections.forEach((section) => section.fields.forEach((field) => {
    values[field.id] = field.defaultValue ?? (field.type === "multiselect" ? [] : field.type === "toggle" ? false : "");
  }));
  const config = getWorklistConfig(page.id, page.title, page.entity);
  const record = recordId
    ? config.rows.find((row) => String(row[config.primaryKey]) === recordId)
    : page.kind === "form" ? config.rows[0] : undefined;
  if (record) {
    const mapping: Record<string, string> = {
      userCode: "id", customerCode: "id", code: "id", displayName: "name", legalName: "name", name: "name", email: "email", mobile: "phone", phone: "phone", status: "status", category: "category", branch: "branch", owner: "owner", accountManager: "owner", customerType: "type", segment: "segment", city: "city", creditLimit: "creditLimit",
    };
    Object.entries(mapping).forEach(([field, source]) => { if (record[source] !== undefined && field in values) values[field] = record[source]; });
  }
  if (page.entity === "user") {
    values.userCode = recordId ?? "USR-00301";
    values.displayName = values.displayName || "Prakash Mathew";
    values.email = values.email || "prakash@nexora.example";
    values.mobile = "+971 50 742 1840";
    values.roles = ["enterprise-admin", "operations-analyst"];
    values.branches = ["hq", "dubai", "sharjah"];
    values.modules = ["hr", "finance", "payroll", "sales", "supply"];
    values.ticket = "REQ-2026-01842";
  }
  return values;
}

function FieldRenderer({ field, value, onChange, disabled, error }: { field: FormFieldSchema; value: string | number | boolean | string[]; onChange: (value: string | number | boolean | string[]) => void; disabled: boolean; error?: string }) {
  const common = { label: field.label, hint: field.help, required: field.required, error, className: field.colSpan === 2 ? "md:col-span-2" : undefined };
  if (field.type === "textarea") return <Textarea {...common} value={String(value ?? "")} disabled={disabled} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "select") return <Select {...common} value={String(value ?? "")} disabled={disabled} options={field.options ?? []} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === "multiselect") return <MultiSelect {...common} value={Array.isArray(value) ? value : []} disabled={disabled} options={field.options ?? []} onChange={onChange as (value: string[]) => void} />;
  if (field.type === "toggle") return <div className={field.colSpan === 2 ? "md:col-span-2" : undefined}><Toggle label={field.label} description={field.help} checked={Boolean(value)} disabled={disabled} onChange={onChange as (checked: boolean) => void} /></div>;
  return <Input {...common} type={field.type === "phone" ? "tel" : field.type} value={String(value ?? "")} disabled={disabled} placeholder={field.placeholder} prefix={field.prefix} suffix={field.suffix} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} />;
}

export function DynamicRecordForm({ page, target }: { page: PageDefinition; target: NavigationTarget }) {
  const { preferences, toast } = useERP();
  const navigation = useNavigation();
  const schema = useMemo(() => getEntitySchema(page.entity, page.title), [page.entity, page.title]);
  const initial = useMemo(() => buildInitialValues(page, target.recordId), [target.recordId, page]);
  const [values, setValues] = useState(initial);

  /* Offer this page to the assistant, on the same contract the worklist uses:
     the page publishes what it already holds and learns nothing about AI. The
     record is what was loaded; form-values is what is on screen NOW, so a draft
     the user has typed but not saved is what a use case reading form-values
     sees. The use case still decides which keys of either may be read. */
  const aiRecord = useMemo(() => {
    const config = getWorklistConfig(page.id, page.title, page.entity);
    return target.recordId
      ? config.rows.find((row) => String(row[config.primaryKey]) === target.recordId)
      : page.kind === "form" ? config.rows[0] : undefined;
  }, [page, target.recordId]);
  usePublishAiSources(`form:${page.id}`, {
    ...(aiRecord ? { "page-record": aiRecord } : {}),
    "form-values": values,
  });
  const [savedValues, setSavedValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(schema.sections[0].id);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState("Just now");
  const mode = target.mode ?? (page.kind === "form" ? "edit" : "view");
  const disabled = mode === "view";
  const dirty = JSON.stringify(values) !== JSON.stringify(savedValues);
  const activeIndex = schema.sections.findIndex((section) => section.id === activeSection);
  const section = schema.sections[activeIndex] ?? schema.sections[0];

  useEffect(() => {
    setValues(initial);
    setSavedValues(initial);
    setErrors({});
    setActiveSection(schema.sections[0].id);
  }, [initial, schema.sections]);

  const completion = useMemo(() => Object.fromEntries(schema.sections.map((item) => {
    const relevant = item.fields.filter((field) => field.required);
    const done = relevant.filter((field) => {
      const value = values[field.id];
      return Array.isArray(value) ? value.length > 0 : value !== "" && value !== null && value !== undefined;
    }).length;
    return [item.id, relevant.length ? Math.round((done / relevant.length) * 100) : 100];
  })), [schema.sections, values]);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    schema.sections.forEach((item) => item.fields.forEach((field) => {
      const value = values[field.id];
      if (field.required && (value === "" || value === undefined || value === null || (Array.isArray(value) && value.length === 0))) next[field.id] = `${field.label} is required`;
    }));
    setErrors(next);
    if (Object.keys(next).length) {
      const firstSection = schema.sections.find((item) => item.fields.some((field) => next[field.id]));
      if (firstSection) setActiveSection(firstSection.id);
      toast({ title: "Complete required fields", message: `${Object.keys(next).length} field${Object.keys(next).length === 1 ? "" : "s"} need attention.`, type: "warning" });
      return false;
    }
    return true;
  }, [schema.sections, toast, values]);

  const save = useCallback(() => {
    if (!validate()) return;
    setSaving(true);
    window.setTimeout(() => {
      setSavedValues(values);
      setSaving(false);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast({ title: mode === "new" ? `${schema.singular} created` : "Changes saved", message: "The mock record passed validation and was saved successfully.", type: "success" });
    }, 420);
  }, [mode, schema.singular, toast, validate, values]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "s" && !disabled) { event.preventDefault(); save(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, save]);

  const update = (field: string, value: string | number | boolean | string[]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors((previous) => { const next = { ...previous }; delete next[field]; return next; });
  };

  return (
    <div className="flex w-full flex-col gap-3" style={{ "--fs-scale": "var(--fs-form)" } as React.CSSProperties}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2"><Badge tone={mode === "view" ? "neutral" : mode === "new" ? "brand" : "warning"}>{mode === "new" ? "NEW RECORD" : mode.toUpperCase()}</Badge><span className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">{target.recordId ?? (mode === "new" ? "Code generated on save" : schema.singular)}</span><span className="h-4 w-px bg-[var(--border)]" /><span className="flex items-center gap-1 text-[length:calc(8.5px*var(--fs-scale))] font-semibold text-[var(--text-muted)]"><Clock3 className="size-3" />Last saved {lastSaved}</span>{dirty ? <Badge tone="warning">Unsaved changes</Badge> : <Badge tone="success"><CheckCircle2 className="size-3" />Saved</Badge>}</div>
        <div data-tour="form-actions" className="flex items-center gap-1.5">
          {mode === "view" ? <Button variant="primary" leftIcon={<Pencil className="size-3.5" />} onClick={() => navigation.open({ pageId: page.id, mode: "edit", recordId: target.recordId, title: `${schema.singular} • Edit` })}>Edit</Button> : <><Button variant="ghost" leftIcon={<RotateCcw className="size-3.5" />} disabled={!dirty} onClick={() => setValues(savedValues)}>Discard</Button><Button variant="secondary" leftIcon={<Save className="size-3.5" />} loading={saving} onClick={save}>Save draft</Button><Button variant="primary" leftIcon={<FileCheck2 className="size-3.5" />} loading={saving} onClick={save}>Save</Button></>}
          <ActionMenu trigger={<IconButton label="More record actions"><MoreHorizontal className="size-4" /></IconButton>}>
            {(close) => <><MenuButton icon={<Copy className="size-3.5" />} label="Duplicate record" onClick={close} /><MenuButton icon={<History className="size-3.5" />} label="View audit history" onClick={close} /><MenuButton icon={<Send className="size-3.5" />} label="Submit for approval" onClick={() => { toast({ title: "Submitted for approval", message: "The record was routed to the configured approval workflow.", type: "info" }); close(); }} /></>}
          </ActionMenu>
        </div>
      </div>

      <Card className="min-h-[590px] overflow-hidden">
        {preferences.formNavigation !== "rail" ? <div data-tour="form-nav"><FormNavigationControl type={preferences.formNavigation} sections={schema.sections} activeId={activeSection} onChange={setActiveSection} completion={completion} /></div> : null}
        <div className={cn("flex min-h-[540px]", preferences.formNavigation === "rail" && "lg:flex-row")}>
          {preferences.formNavigation === "rail" ? <div data-tour="form-nav" className="flex shrink-0"><FormNavigationControl type="rail" sections={schema.sections} activeId={activeSection} onChange={setActiveSection} completion={completion} /></div> : null}
          <div className="min-w-0 flex-1">
            <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4">
              <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[length:calc(11px*var(--fs-scale))] font-black text-[var(--primary-strong)]">{activeIndex + 1}</span><div><h2 className="text-[length:calc(14px*var(--fs-scale))] font-black tracking-[-.02em]">{section.title}</h2><p className="mt-0.5 text-[length:calc(10px*var(--fs-scale))] text-[var(--text-muted)]">{section.description}</p></div></div></div><div className="hidden items-center gap-2 lg:flex"><Badge tone="neutral">{section.fields.length} fields</Badge><Badge tone={completion[section.id] === 100 ? "success" : "warning"}>{completion[section.id]}% complete</Badge></div></div>
            </div>

            <div className="p-5">
              <div data-tour="form-body" className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {section.fields.map((field) => <FieldRenderer key={field.id} field={field} value={values[field.id]} disabled={disabled} error={errors[field.id]} onChange={(value) => update(field.id, value)} />)}
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--success)]" /><div><div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">Policy-aware</div><div className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">Visible and editable fields can be controlled by role, branch and record state.</div></div></div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" /><div><div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">Schema-driven</div><div className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">Rail, tabs and wizard render the same section and field definitions.</div></div></div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" /><div><div className="text-[length:calc(10px*var(--fs-scale))] font-extrabold">Audit protected</div><div className="mt-1 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">Sensitive changes should be versioned and submitted with a reason.</div></div></div>
              </div>
            </div>
          </div>

          <aside className="hidden w-64 shrink-0 border-l border-[var(--border)] bg-[var(--surface-2)] p-4 2xl:block">
            <div className="text-[length:calc(9px*var(--fs-scale))] font-black uppercase tracking-[.12em] text-[var(--text-subtle)]">Record summary</div>
            <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"><div className="text-[length:calc(8.5px*var(--fs-scale))] font-bold uppercase tracking-[.08em] text-[var(--text-subtle)]">Overall completion</div><div className="mt-2 flex items-end justify-between"><span className="text-[length:calc(22px*var(--fs-scale))] font-black tracking-[-.04em]">{Math.round(Object.values(completion).reduce((sum, item) => sum + item, 0) / schema.sections.length)}%</span><Badge tone="brand">{schema.sections.length} sections</Badge></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.round(Object.values(completion).reduce((sum, item) => sum + item, 0) / schema.sections.length)}%` }} /></div></div>
            <div className="mt-3 space-y-2">{schema.sections.map((item, index) => <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--surface)]"><span className={cn("flex size-5 items-center justify-center rounded-md text-[length:calc(8px*var(--fs-scale))] font-black", item.id === activeSection ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-3)]")}>{index + 1}</span><span className="min-w-0 flex-1 truncate text-[length:calc(9.5px*var(--fs-scale))] font-bold">{item.title}</span><span className="text-[length:calc(8.5px*var(--fs-scale))] font-bold text-[var(--text-muted)]">{completion[item.id]}%</span></button>)}</div>
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border-strong)] p-3 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><b className="text-[var(--text)]">Form mode:</b> {preferences.formNavigation}. Change it in My Preferences; the record schema and data remain unchanged.</div>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <Button variant="ghost" leftIcon={<ArrowLeft className="size-3.5" />} disabled={activeIndex === 0} onClick={() => setActiveSection(schema.sections[activeIndex - 1].id)}>Previous</Button>
          <div className="text-[length:calc(9px*var(--fs-scale))] font-semibold text-[var(--text-muted)]">Section {activeIndex + 1} of {schema.sections.length} • {preferences.formNavigation} navigation</div>
          {activeIndex < schema.sections.length - 1 ? <Button variant="secondary" rightIcon={<ArrowRight className="size-3.5" />} onClick={() => setActiveSection(schema.sections[activeIndex + 1].id)}>Next</Button> : disabled ? <Button variant="secondary" leftIcon={<Eye className="size-3.5" />}>Review complete</Button> : <Button variant="primary" leftIcon={<Save className="size-3.5" />} loading={saving} onClick={save}>Save record</Button>}
        </div>
      </Card>
    </div>
  );
}
