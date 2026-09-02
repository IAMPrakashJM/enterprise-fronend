# Nexora Enterprise ERP

A data-heavy, multi-module ERP prototype. One shared component layer, two shells.

```
apps/web        Next.js 16 — every page is a URL; records open in browser tabs   :3000
apps/desktop    Vite 7 + Tauri 2 — records open in in-window workspace tabs      :3001
packages/*      @pepbits/* — the shared surface both shells render
```

## Run

```bash
npm install
npm run dev:web        # http://localhost:3000
npm run dev:desktop    # http://localhost:3001 in a browser
npm run desktop        # native Tauri window
```

Requires Node 24+, and for the Tauri window a Rust toolchain and Xcode Command Line
Tools.

## Verify

```bash
npx turbo run build    # both apps
npm run verify:parity  # moved files still identical to the pre-migration originals
```

Add `--css` to also diff the emitted stylesheet against a baseline build:

```bash
git worktree add .baseline-build 7951db3 \
  && (cd .baseline-build/webapp && npm install && npm run build)
node scripts/verify-parity.mjs --css
```

## The packages

| Package | What it owns | Depends on |
|---|---|---|
| `@pepbits/tokens` | `tokens.css` — the `:root` custom properties and all seven themes | — |
| `@pepbits/ops-ui` | the generic interaction surface: Button, Badge, Card, Dropdown, Overlay, form controls, Pagination, Tabs, `NavLink`, `cn` | — |
| `@pepbits/platform-ports` | `NavigationPort` — the web/desktop seam | — |
| `@pepbits/erp-config` | navigation tree, page registry, entity schemas, themes, i18n, types | — |
| `@pepbits/erp-data` | mock datasets and the worklist config builder | `erp-config` |
| `@pepbits/erp-shell` | `ERPProvider`, Header, Sidebar, Footer, `EnterpriseShell`, the global overlays | `ops-ui`, `erp-config`, `platform-ports` |
| `@pepbits/erp-screens` | `PageRenderer` and all eight page kinds | all of the above |

Apps depend on packages; packages never depend on apps.

## Tab behaviour differs on purpose

`@pepbits/platform-ports` defines a `NavigationPort`. Shared screens call `open` or
`openInNewContext` and never learn what a tab is.

| | web | desktop |
|---|---|---|
| `open` | `router.push` — navigate in place | reuse the matching tab, else append one |
| `openInNewContext` | `window.open(…, "_blank")` — a new browser tab | append an MDI tab |
| `hrefFor` | `/{module}/{pageId}[/{recordId}][/edit]` | `"#"` |

Tab state exists only in `apps/desktop/src/mdi/`. The web app cannot grow a tab bug
because it has no tab state.

## Rules

**Presentation is frozen.** A change that moves a pixel is a defect unless it is one of
the two deltas recorded in the spec §9.1 (no tab strip on web, no "Open records in tabs"
control on web). `npm run verify:parity` is what proves it.

**No copy of `header.tsx`, `sidebar.tsx` or `footer.tsx` may exist under `apps/`.** A
shell change goes into `@pepbits/erp-shell` behind a prop, or it does not happen. The
neighbouring `pepcare-platform` forked its shared shell into one app and the two drifted
by 179 lines of CSS; the package now has no product consumer at all.

**If a package ends up with no importer, delete it.**

## Two traps worth knowing

**Tailwind purges package classes without `@source`.** Each app's entry stylesheet
declares every package directory containing class strings. Miss one and those utilities
vanish with no error anywhere — the app just renders wrong.

**`@import` must precede every other statement.** Putting `@import "@pepbits/tokens/…"`
after the `@source` lines makes postcss drop it silently. That builds cleanly and ships a
stylesheet with zero theme tokens: a completely colourless app, with only a line in the
build log.

## Docs

- `docs/superpowers/specs/2026-09-03-nexora-monorepo-design.md` — the design and its constraints
- `docs/superpowers/plans/2026-09-03-nexora-monorepo.md` — the implementation plan
