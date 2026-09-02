"use client";

import React from "react";
import { BookOpen, FileSpreadsheet, WandSparkles } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Toggle } from "@pepbits/ops-ui";
import type { PageDefinition } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "@pepbits/erp-shell";

const COMPONENT_ROWS = [
  ["Button", "ui/button.tsx", "Variants, sizes, loading, icons and focus contract"],
  ["Form controls", "ui/form-controls.tsx", "Input, search, textarea, select, multiselect and toggle"],
  ["Overlay", "ui/overlay.tsx", "Modal, center record card and left/right drawer"],
  ["Worklist", "worklist/worklist-page.tsx", "Filters, views, columns, sorting, pagination and preview"],
  ["Dynamic form", "forms/dynamic-record-form.tsx", "Schema-driven rail, tabs and wizard presentation"],
  ["Billing", "billing/billing-page.tsx", "Header records, lines, payments, tax and print composition"],
  ["Application shell", "layout/enterprise-shell.tsx", "Header, module navigation, sidebar, tabs and footer"],
];

export function LibraryPage({ page }: { page: PageDefinition }) {
  const { toast } = useERP();
  const navigation = useNavigation();
  const openPage = (pageId: string) => navigation.open({ pageId });
  return (
    <div className="mx-auto flex max-w-[1700px] flex-col gap-3">
      <div className="surface-grid overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><Badge tone="violet">DEVELOPER LIBRARY</Badge><h2 className="mt-3 text-[22px] font-black tracking-[-.04em]">{page.title}</h2><p className="mt-2 text-[10.5px] leading-relaxed text-[var(--text-muted)]">A shared, schema-driven component platform for ERP masters, transactions, worklists, reports and utilities. Pages compose reusable controls instead of duplicating markup or visual rules.</p></div><div className="flex gap-2"><Button leftIcon={<BookOpen className="size-3.5" />} onClick={() => openPage("integration-guide")}>Integration guide</Button><Button variant="primary" leftIcon={<FileSpreadsheet className="size-3.5" />} onClick={() => openPage("spreadsheet-studio")}>Spreadsheet Studio</Button></div></div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_.8fr]">
        <Card>
          <CardHeader><CardTitle title="Shared component registry" subtitle="Change a primitive once; all consuming pages inherit the contract." action={<Badge tone="brand">{COMPONENT_ROWS.length} families</Badge>} /></CardHeader>
          <div className="overflow-auto"><table className="w-full min-w-[680px] text-[10px]"><thead className="bg-[var(--surface-2)] text-left text-[8.5px] uppercase tracking-[.08em] text-[var(--text-subtle)]"><tr><th className="px-4 py-2.5">Component</th><th className="px-4 py-2.5">Source</th><th className="px-4 py-2.5">Contract</th><th className="px-4 py-2.5">Status</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{COMPONENT_ROWS.map(([name, source, contract]) => <tr key={name} className="hover:bg-[var(--surface-2)]"><td className="px-4 py-3 font-extrabold">{name}</td><td className="px-4 py-3 font-mono text-[9px] text-[var(--primary)]">{source}</td><td className="px-4 py-3 text-[var(--text-muted)]">{contract}</td><td className="px-4 py-3"><Badge tone="success">Ready</Badge></td></tr>)}</tbody></table></div>
        </Card>
        <Card>
          <CardHeader><CardTitle title="Live primitives" subtitle="Theme-aware interactive examples" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2"><Button variant="primary">Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="danger">Danger</Button></div>
            <Input label="Reusable text input" placeholder="Component-bound value" hint="Validation, density and theme are inherited." />
            <Select label="Reusable select" options={[{ label: "Enterprise", value: "enterprise" }, { label: "Professional", value: "professional" }]} />
            <Toggle label="Policy-controlled option" description="A standard accessible toggle contract." checked onChange={() => undefined} />
            <div className="flex flex-wrap gap-2"><Badge tone="success">Success</Badge><Badge tone="warning">Warning</Badge><Badge tone="danger">Exception</Badge><Badge tone="info">Information</Badge></div>
            <Button className="w-full" leftIcon={<WandSparkles className="size-3.5" />} onClick={() => toast({ title: "Component event", message: "The shared toast service handled this component action.", type: "success" })}>Test component feedback</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Schema first", "Fields and sections are defined once and rendered by every form presentation."],
          ["Semantic themes", "Components consume tokens such as surface, border, primary and text."],
          ["Stable contracts", "New properties remain optional or versioned to protect existing pages."],
          ["Keyboard ready", "Global and page-specific actions are discoverable and focus accessible."],
        ].map(([title, description], index) => <Card key={title}><CardContent><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[10px] font-black text-[var(--primary)]">0{index + 1}</span><h3 className="mt-3 text-[12px] font-black">{title}</h3><p className="mt-1.5 text-[9.5px] leading-relaxed text-[var(--text-muted)]">{description}</p></CardContent></Card>)}
      </div>
    </div>
  );
}

