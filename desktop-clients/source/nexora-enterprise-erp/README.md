# Nexora Enterprise ERP Workspace

A data-heavy, multi-module ERP user-interface prototype built with Next.js App Router, React, TypeScript, Tailwind CSS, and shared schema-driven components.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Next.js, normally `http://localhost:3000`.

Production validation:

```bash
npm run lint
npm run build
npm run start
```

## Included modules

- Human Resources
- Finance and Accounting
- Payroll
- Sales and CRM
- Supply Chain
- Developer Library

## Core interactions

- Sidebar starts collapsed, expands on hover, collapses on mouse-out, and can be pinned.
- Sidebar can be placed on the left or right.
- Module selection resets the three-level module navigation.
- Workspace tabs allow multiple pages and records to remain open.
- Worklists support basic and advanced filters, table/card views, configurable columns, sorting, pagination, saved-view examples, record preview, view, edit, and new actions.
- Forms share one schema and can render as a section rail, horizontal tabs, or a guided wizard.
- Record previews can render as a centered card, centered modal, left drawer, or right drawer.
- Preferences control themes, fonts, density, navigation, forms, record views, pagination, toast behavior, help, language, direction, motion, and billing layout.
- Spreadsheet Studio supports Excel/CSV import, editable cells, cost recalculation, and Excel export.
- Contextual help, documentation, command palette, keyboard shortcuts, notifications, and toast feedback are connected to the application shell.

## Keyboard shortcuts

- `Ctrl/Cmd + K`: command palette
- `Ctrl/Cmd + ,`: My Preferences
- `Alt + N`: create a record from the active page
- `Alt + S`: save an editable form
- `?`: contextual page helper

## Architecture

- `app/`: Next.js entry points and global semantic-token styling
- `src/components/ui/`: reusable low-level controls
- `src/components/layout/`: application shell, header, sidebar, tabs, and footer
- `src/components/worklist/`: reusable list, filter, table, card, column, preview, and pagination composition
- `src/components/forms/`: schema-driven forms and navigation variants
- `src/components/billing/`: transaction workspace
- `src/components/reports/`: reporting workspace
- `src/components/shared/enterprise-app.tsx`: central page renderer and global interaction layers
- `src/config/`: navigation, page registry, entity schemas, themes, and localization
- `src/context/erp-context.tsx`: preferences, module, workspace tabs, toast, help, and command state
- `src/data/mock.ts`: mock ERP datasets

## Validation note

The source files were checked for TypeScript/TSX syntax and internal alias imports. Package installation and a complete `next build` could not be executed in the artifact environment because access to the npm registry timed out. Run the production validation commands after extracting the project.
