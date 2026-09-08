# Reusable UI components

Implemented on 8 September 2026. Web and desktop import the same components.

## What is available

| Need | Shared component | Package |
| --- | --- | --- |
| Card, header, title, body, footer | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` | `@pepbits/ops-ui` |
| Fixed or automatically fitting card grid | `CardGrid` | `@pepbits/ops-ui` |
| KPI card | Existing `StatCard` | `@pepbits/ops-ui` |
| Basic/report/grouped table structure | `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `TableContainer` | `@pepbits/ops-ui` |
| Compact, comfortable, striped, bordered, sticky-header tables | Optional properties on `Table` | `@pepbits/ops-ui` |
| Sortable, selectable and inline-editable record table | Existing `DataTable`, now publicly exported | `@pepbits/erp-screens` |
| Filtering, pagination, saved views and bulk actions | Existing `WorklistPage` and its controllers | `@pepbits/erp-screens` |
| Spreadsheet workspace | Existing `SpreadsheetPage` | `@pepbits/erp-screens` |
| Inline month calendar | `Calendar` | `@pepbits/ops-ui` |
| Date, time, local date/time, month and week inputs | `DateInput`, `TimeInput`, `DateTimeInput`, `MonthInput`, `WeekInput` | `@pepbits/ops-ui` |
| Start/end date fields | `DateRangeInput` | `@pepbits/ops-ui` |
| Text, numbers, money, percentages and dates | `DataValue`, using the application's existing formatter | `@pepbits/ops-ui` |
| Label/value record details | `DescriptionList` | `@pepbits/ops-ui` |

The shared table elements preserve the actual HTML table structure. Custom cells,
buttons, totals, row/column spans, refs, event handlers and classification attributes
pass through. Existing screen layouts and export/print rules continue to apply.
They do not infer permissions or implement server queries.

“All table types” is not a claim that a new pivot engine, virtualized million-row
grid or tree-data controller was built. These require their own data behavior;
they can compose the same table primitives. The existing spreadsheet and worklist
remain the components for their respective workflows.

## Where it is used

Existing tables in dashboard, billing, reports, component library, CSV preview,
spreadsheet, worklist and AI administration now use the shared table elements.
A repository check rejects new raw table elements outside `ops-ui`.

Dashboard KPI cards and report summary cards use `CardGrid`. Billing and report
scheduling use dedicated date/time inputs; schema forms use `DateInput` for date
fields. Worklist text values use `DataValue` while existing numeric formatters and
status badges keep their behavior.

Open **Developer Library → Component Gallery** to try a linked calendar and date
field, time entry and the updated component registry. Selecting a calendar date
updates the field; typing a date updates the calendar. These examples do not save
business records.

## Integrating another application

Install these workspace packages in the consuming application and include their
source paths in Tailwind scanning. Load the shared theme tokens and provide the
existing `LocalizationProvider` (the ERP shell already does this).

```tsx
import { useState } from "react";
import {
  Card, CardContent, CardGrid, Calendar, TimeInput, DataValue,
} from "@pepbits/ops-ui";

export function AppointmentFields() {
  const [date, setDate] = useState("2026-09-08");
  const [time, setTime] = useState("09:00");
  return (
    <CardGrid columns={2}>
      <Card><CardContent>
        <Calendar label="appointment.date" value={date} onChange={setDate} />
      </CardContent></Card>
      <Card><CardContent>
        <TimeInput label="appointment.time" value={time}
          onChange={event => setTime(event.target.value)} />
        <DataValue value={date} />
      </CardContent></Card>
    </CardGrid>
  );
}
```

Register those example `appointment.*` labels in the product's language catalogs.
Use `columns="auto"` with `minCardWidth` for fitting cards to a desktop panel.
Omit `columns` to keep page-defined breakpoint classes. Supply `gap` or `style`
when the default 12-pixel gap is unsuitable.

```tsx
<TableContainer>
  <Table density="compact" striped bordered stickyHeader>
    <TableCaption>{t("customers.title")}</TableCaption>
    <TableHeader><TableRow>
      <TableHead scope="col">{t("customers.name")}</TableHead>
      <TableHead scope="col">{t("customers.balance")}</TableHead>
    </TableRow></TableHeader>
    <TableBody>{customers.map(customer => <TableRow key={customer.id}>
      <TableCell>{customer.name}</TableCell>
      <TableCell><DataValue value={customer.balance} numeric
        format={value => format.money(value)} /></TableCell>
    </TableRow>)}</TableBody>
  </Table>
</TableContainer>
```

Import the table components from `@pepbits/ops-ui`. This example assumes the
caller provides `customers`, `t`, and the current preference-aware `format`.
Preserve the product's classification attributes and permission checks when
presenting protected data. Shared presentation components do not grant access.

## Dates, localization and accessibility

- Date values remain `YYYY-MM-DD`; time values remain `HH:mm` (or seconds when
  requested with `step`). Do not submit a localized display string to the API.
- `DateTimeInput` holds a local wall-clock value. The application must choose the
  timezone before converting it into an instant.
- Native inputs use the browser/OS picker. Their visual formatting can differ
  from the application's regional display preferences.
- The custom calendar localizes Gregorian month names, weekday names and day
  numbers. An optional `locale` overrides the current UI language. It is not a
  Hijri calendar or an appointment scheduling service.
- Arrow keys move between days; Home/End move within the week; Enter/Space select.
  Left/right arrows follow the current RTL direction. Month buttons are labelled,
  selection is announced, and min/max/disabled constraints apply.
- Narrow weekday headings avoid overlapping Arabic names; full names remain
  available as accessible labels and hover titles.
- `DateRangeInput` tightens the two native inputs' min/max constraints. Business
  validation is still required at submission, especially for existing invalid data.
- `DataValue` does not translate business content. Pass existing preference-aware
  formatters for numbers, currencies and dates. `DescriptionList` translates labels.

## Validation and release status

- 1,383 unit/component tests passed, including new calendar, date range, table
  semantics/classification and data formatting checks.
- Web and desktop production builds and package typechecks passed.
- Repository checks, including localization and export safety, passed.
- Existing page workflows passed in English, Arabic, Hindi and Malayalam.
- The interactive gallery passed date selection, keyboard navigation, month
  changes, time entry and RTL checks in those four languages.

Run `npm test`, `npm run build`, `npm run verify` and
`node e2e/shared-components.mjs` from `desktop-clients`. The browser test expects
an isolated frontend at port 3109 and matching API; configure `E2E_DESKTOP` and
`PLAYWRIGHT_PATH` if necessary. Screenshots go to `/tmp/shared-components-artifacts`.

These changes are in the workspace; this component update has not been deployed.
New translated registry wording still requires native-speaker approval.

## Page adoption follow-up

The remaining matching page markup has now been migrated. This is shared source
used by both web and desktop; it does not require separate page implementations.

| Page or workflow | Components applied |
| --- | --- |
| Dashboard | Card toolbars, card grids, table containers |
| Worklists and filters | Card toolbars, dedicated date filters, table containers |
| Record preview | Cards, description lists and formatted data values |
| Dynamic forms | Card toolbars and read-only cards; shared date inputs retained |
| Billing | Card toolbar and supporting cards; table containers; shared date fields retained |
| Reports | Card toolbar, summary/chart grids, supporting cards and table containers |
| Spreadsheet | Card toolbar and bounded table container |
| CSV import | Bounded preview and error-table containers |
| Record history and save conflicts | Shared cards and comparison-table container |
| Attachments, comments and related records | Matching record-panel cards |
| Approval workflow | Matching summary/status cards |
| Inbox | Supporting information card |
| Consultation and recorder | Semantic section cards, supporting cards, card grids and review-dialog card |
| Preferences | Card header, supporting cards and card-layout grid |
| Component gallery | Introductory card, example grids and registry table container |
| Login | Shared card preserving its two-column layout and large shadow |
| AI administration | Card grid, supporting cards and table container |
| AI assistant, inline actions and transparency | Matching cards and policy description list |

`Card` accepts `as="section"` or `as="article"` to retain semantic elements,
`shadow="none" | "sm" | "lg"`, `tone="surface" | "muted" | "transparent"`,
and `radius="default" | "lg" | "xl" | "2xl"`. These options preserve the
appearance of existing page containers without competing utility classes.

`CardGrid` retains existing breakpoint and gap classes; it no longer inserts an
inline 12-pixel gap over a page's custom spacing. Explicit `gap` still overrides
classes. `TableContainer` accepts `overflow="both" | "horizontal" | "hidden"`
and preserves refs, height limits and other caller properties.

`DescriptionList` supports `inline`, `stacked` and `rows` layouts. Optional item,
term and value classes preserve record-preview and policy-summary styling.

Warning/error banners, chart marks, editor layouts, tab groups, choice buttons,
and document print composition keep their specialized structure. Replacing these
with generic cards would change their meaning or interaction. Inline calendars
remain available where a month view is appropriate; ordinary date fields use the
shared native date-input component.

Run `npm run verify:shared-components` to check adoption across page and AI source
files. It rejects copied standard cards, grids containing cards, raw tables,
page-owned table scroll wrappers and generic inputs used for dates or times.

Follow-up validation: all 1,383 tests passed, both production builds passed, and
repository verification passed. The adoption audit checked 32 page/AI source
files with 126 shared component uses. Four-language page workflows, interactive
gallery checks, real XLSX downloads and invoice PDF checks also passed. These
checks used isolated local services; the live demo release was not changed.
