"use client";
import { TableContainer } from "@pepbits/ops-ui";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@pepbits/ops-ui";
import { LocalizedText } from "@pepbits/ops-ui";


import React, { useState } from "react";
import { BookOpen, FileSpreadsheet, WandSparkles } from "lucide-react";
import { Calendar, CardGrid, DateInput, TimeInput, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Toggle } from "@pepbits/ops-ui";
import type { PageDefinition } from "@pepbits/erp-config";
import { useNavigation } from "@pepbits/platform-ports";
import { useERP } from "@pepbits/erp-shell";

const COMPONENT_ROWS = [
  ["ui.components.cards", "ops-ui/src/card.tsx", "ui.components.cards.help"],
  ["ui.components.tables", "ops-ui/src/table.tsx", "ui.components.tables.help"],
  ["ui.components.dates", "ops-ui/src/calendar.tsx + date-time.tsx", "ui.components.dates.help"],
  ["ui.components.values", "ops-ui/src/data-value.tsx", "ui.components.values.help"],
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
  const [date, setDate] = useState("2026-09-08");
  const [time, setTime] = useState("09:00");
  const navigation = useNavigation();
  const openPage = (pageId: string) => navigation.open({ pageId });
  return (
    <div className="flex w-full flex-col gap-3">
      <Card className="surface-grid overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><Badge tone="violet"><LocalizedText message="ui.developer.library.331d19aa" /></Badge><h2 className="mt-3 text-[length:calc(22px*var(--fs-scale))] font-black tracking-[-.04em]"><LocalizedText message={page.title} /></h2><p className="mt-2 text-[length:calc(10.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message="ui.a.shared.schema.driven.component.platform.for.erp.master.35e8912f" /></p></div><div className="flex gap-2"><Button leftIcon={<BookOpen className="size-3.5" />} onClick={() => openPage("integration-guide")}><LocalizedText message="ui.integration.guide.02a0a9e2" /></Button><Button variant="primary" leftIcon={<FileSpreadsheet className="size-3.5" />} onClick={() => openPage("spreadsheet-studio")}><LocalizedText message="ui.spreadsheet.studio.851de496" /></Button></div></div>
      </Card>

      <CardGrid className="gap-3 xl:grid-cols-[1.4fr_.8fr]">
        <Card>
          <CardHeader><CardTitle title="ui.shared.component.registry.7978f6d8" subtitle="ui.change.a.primitive.once.all.consuming.pages.inherit.the.7c4d537a" action={<Badge tone="brand">{COMPONENT_ROWS.length}<LocalizedText message="ui.families.5b30f82d" /></Badge>} /></CardHeader>
          <TableContainer className=""><Table className="w-full min-w-[680px] text-[length:calc(10px*var(--fs-scale))]"><TableHeader className="bg-[var(--surface-2)] text-left text-[length:calc(8.5px*var(--fs-scale))] uppercase tracking-[.08em] text-[var(--text-subtle)]"><TableRow><TableHead className="px-4 py-2.5"><LocalizedText message="ui.component.ce54f0e2" /></TableHead><TableHead className="px-4 py-2.5"><LocalizedText message="ui.source.0e570ca6" /></TableHead><TableHead className="px-4 py-2.5"><LocalizedText message="ui.contract.a6f5b0e5" /></TableHead><TableHead className="px-4 py-2.5"><LocalizedText message="ui.status.920e413c" /></TableHead></TableRow></TableHeader><TableBody className="divide-y divide-[var(--border)]">{COMPONENT_ROWS.map(([name, source, contract]) => <TableRow key={name} className="hover:bg-[var(--surface-2)]"><TableCell className="px-4 py-3 font-extrabold"><LocalizedText message={name}/></TableCell><TableCell className="px-4 py-3 font-mono text-[length:calc(9px*var(--fs-scale))] text-[var(--primary)]">{source}</TableCell><TableCell className="px-4 py-3 text-[var(--text-muted)]"><LocalizedText message={contract}/></TableCell><TableCell className="px-4 py-3"><Badge tone="success"><LocalizedText message="ui.ready.5fa7aac5" /></Badge></TableCell></TableRow>)}</TableBody></Table></TableContainer>
        </Card>
        <Card>
          <CardHeader><CardTitle title="ui.live.primitives.de2796a6" subtitle="ui.theme.aware.interactive.examples.fdb52b03" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2"><Button variant="primary"><LocalizedText message="ui.primary.action.da2eb576" /></Button><Button variant="secondary"><LocalizedText message="ui.secondary.62f2ccff" /></Button><Button variant="outline"><LocalizedText message="ui.outline.eabbf3ab" /></Button><Button variant="danger"><LocalizedText message="ui.danger.8412c070" /></Button></div>
            <Input label="ui.reusable.text.input.5e2c4d45" placeholder="ui.component.bound.value.ef5529c4" hint="ui.validation.density.and.theme.are.inherited.80e13234" />
            <Select label="ui.reusable.select.8715bdac" options={[{ label: "Enterprise", value: "enterprise" }, { label: "Professional", value: "professional" }]} />
            <CardGrid columns={2}>
              <DateInput label="ui.start.date.81696931" value={date} onChange={event => setDate(event.target.value)} />
              <TimeInput label="ui.delivery.time.2898c4bc" value={time} onChange={event => setTime(event.target.value)} />
            </CardGrid>
            <Calendar label="ui.start.date.81696931" value={date} onChange={setDate} className="max-w-full" />
            <Toggle label="ui.policy.controlled.option.c39ca589" description="ui.a.standard.accessible.toggle.contract.a5e4bf2f" checked onChange={() => undefined} />
            <div className="flex flex-wrap gap-2"><Badge tone="success"><LocalizedText message="ui.success.c88a0b90" /></Badge><Badge tone="warning"><LocalizedText message="ui.warning.e981ddae" /></Badge><Badge tone="danger"><LocalizedText message="ui.exception.b4fe3d52" /></Badge><Badge tone="info"><LocalizedText message="ui.information.1cb0ba12" /></Badge></div>
            <Button className="w-full" leftIcon={<WandSparkles className="size-3.5" />} onClick={() => toast({ title: "Component event", message: "The shared toast service handled this component action.", type: "success" })}><LocalizedText message="ui.test.component.feedback.e618724b" /></Button>
          </CardContent>
        </Card>
      </CardGrid>

      <CardGrid className="gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Schema first", "Fields and sections are defined once and rendered by every form presentation."],
          ["Semantic themes", "Components consume tokens such as surface, border, primary and text."],
          ["Stable contracts", "New properties remain optional or versioned to protect existing pages."],
          ["Keyboard ready", "Global and page-specific actions are discoverable and focus accessible."],
        ].map(([title, description], index) => <Card key={title}><CardContent><span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[length:calc(10px*var(--fs-scale))] font-black text-[var(--primary)]">0{index + 1}</span><h3 className="mt-3 text-[length:calc(12px*var(--fs-scale))] font-black"><LocalizedText message={title} /></h3><p className="mt-1.5 text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]"><LocalizedText message={description} /></p></CardContent></Card>)}
      </CardGrid>
    </div>
  );
}

