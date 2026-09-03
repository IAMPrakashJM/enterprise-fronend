# Nexora ERP — monorepo conversion with a shared component layer and a Tauri desktop shell

**Date:** 2026-09-03
**Status:** Approved (design), pending spec review
**Branch:** `feat/monorepo-tauri`
**Baseline commit:** `9ae218a`

## 1. Goal

Convert the single Next.js application at `webapp/` into an npm-workspaces + Turborepo
monorepo that builds two shells over one shared component layer:

- **`apps/web`** — a Next.js application where every page is a real URL and multiple
  open records are real browser tabs.
- **`apps/desktop`** — a Vite + Tauri 2 application that keeps the current in-page
  workspace tab strip (MDI).

All UI, configuration, mock data and shell chrome move into `@pepbits/*` packages that
both shells consume unchanged.

## 2. Hard constraints

These are requirements, not preferences. A change that violates one is a defect.

1. **Presentation is frozen.** No pixel moves as a result of this restructuring. Same
   components, same JSX structure, same `className` strings, same Tailwind classes, same
   theme tokens. This mirrors ADR-0001 §5 in the neighbouring `pepcare-platform`
   frontend, which governs an equivalent migration. Two deltas on web are intentional
   consequences of the new navigation model rather than violations; they are enumerated
   and bounded in section 9.1. Nothing else may change.
2. **No runtime dependency changes.** The dependency set stays `next`, `react`,
   `react-dom`, `lucide-react`, `xlsx`, `tailwindcss`. Tauri and Vite are additions
   required by the new desktop shell, not replacements. No component library, styling
   library, state library or router library is introduced.
3. **No behavioural change on desktop.** The desktop shell behaves as `webapp` does
   today, except where a defect listed in section 10 is corrected.
4. **Web drops the in-page tab strip.** Navigation is URL-driven; a second open record
   is a second browser tab.

## 3. Decisions taken

| # | Decision | Rationale |
|---|---|---|
| D1 | Record actions on web call `window.open(url, "_blank")` | Mirrors desktop MDI one-for-one: the same gesture opens a new container in both shells. Rows remain real anchors, so ctrl/cmd-click also works. |
| D2 | Seven `@pepbits/*` packages | One answerable purpose each; proportional to ~4,100 lines. Mirrors the package granularity already in use in `pepcare-platform/frontend/provider-web`. |
| D3 | URL scheme `/{module}/{page}[/{recordId}][/edit]` | Self-describing URLs matching the sidebar's mental model. Requires a canonical-redirect guard (section 6). |
| D4 | Navigation is an injected port, not shared state | Shared screens never learn what a tab is. Web and desktop supply different implementations of one interface. |
| D5 | Desktop is Vite 7 + React 19 + Tauri 2 | The toolchain shape used by `apps/allyvora-desktop` next door. See the correction below — that app is a precedent for the *stack*, not for package sharing. |

> **Correction, 2026-09-03.** An earlier draft justified D5 by saying `allyvora-desktop`
> proves `@pepbits/*` packages can be shared between a Next app and a Vite/Tauri app. It
> does not. That app declares `@pepbits/ops-ui` as a dependency and imports it in **zero
> source files**; it runs Tailwind v3 with a colour map sharing almost no names with
> ops-ui's `@theme`, so every ops-ui utility would be ungenerated there anyway; and it is
> built by no pipeline and deployed nowhere. The sharing pattern is therefore **unproven
> next door and proven by nothing** — this project is the first real instance of it.
> Consequences for this design: (a) Tailwind stays at v4 in *both* applications here,
> which is what makes sharing viable at all; (b) the section 9.2 source-scanning step is
> not a precaution copied from a working system, it is the load-bearing mechanism, and
> step 6 must verify it before anything else is attributed to the migration.

## 4. Target structure

```
enterprise-fronend/
├── package.json              workspaces: ["apps/*", "packages/*"]
├── turbo.json                build / lint / dev
├── tsconfig.base.json        shared compiler options
├── .gitignore                (new at root; currently only webapp/.gitignore exists)
├── apps/
│   ├── web/                  Next.js 16.3.3            :3000
│   └── desktop/              Vite 7 + Tauri 2          :3001 (dev) / native
└── packages/
    ├── tokens/               @pepbits/tokens
    ├── ops-ui/               @pepbits/ops-ui
    ├── erp-config/           @pepbits/erp-config
    ├── erp-data/             @pepbits/erp-data
    ├── erp-shell/            @pepbits/erp-shell
    ├── erp-screens/          @pepbits/erp-screens
    └── platform-ports/       @pepbits/platform-ports
```

`webapp/` ceases to exist; its contents are distributed by the move map in section 5.

### Dependency direction

```
tokens           ──────────────────────────►  (nothing)
ops-ui           ──────────────────────────►  (nothing)
platform-ports   ──────────────────────────►  (nothing; pure types)
erp-config       ──────────────────────────►  (nothing)
erp-data         ──────────────────────────►  erp-config
erp-shell        ──────────────────────────►  ops-ui, erp-config, platform-ports
erp-screens      ──────────────────────────►  ops-ui, erp-config, erp-data,
                                              erp-shell, platform-ports
apps/*           ──────────────────────────►  all packages
```

Acyclic. Packages never import from applications. `ops-ui` depends on nothing, which
keeps it a generic interaction surface rather than an ERP-specific one — the same rule
`packages/README.md` states next door.

Packages ship TypeScript source with no per-package build step. `apps/web` lists them in
`transpilePackages`; Vite resolves them through the workspace symlink.

## 5. Move map

Every file's destination. Moves use `git mv` so history survives.

### `@pepbits/tokens`

| From | To |
|---|---|
| `webapp/app/globals.css` | `packages/tokens/src/tokens.css` |

The seven theme blocks and the `:root` custom properties move verbatim. Both applications
import this file once.

### `@pepbits/ops-ui`

| From | To |
|---|---|
| `webapp/src/components/ui/badge.tsx` | `packages/ops-ui/src/badge.tsx` |
| `webapp/src/components/ui/button.tsx` | `packages/ops-ui/src/button.tsx` |
| `webapp/src/components/ui/card.tsx` | `packages/ops-ui/src/card.tsx` |
| `webapp/src/components/ui/dropdown.tsx` | `packages/ops-ui/src/dropdown.tsx` |
| `webapp/src/components/ui/empty-state.tsx` | `packages/ops-ui/src/empty-state.tsx` |
| `webapp/src/components/ui/form-controls.tsx` | `packages/ops-ui/src/form-controls.tsx` |
| `webapp/src/components/ui/overlay.tsx` | `packages/ops-ui/src/overlay.tsx` |
| `webapp/src/components/ui/pagination.tsx` | `packages/ops-ui/src/pagination.tsx` |
| `webapp/src/components/ui/tabs.tsx` | `packages/ops-ui/src/tabs.tsx` |
| `webapp/src/lib/cn.ts` | `packages/ops-ui/src/cn.ts` |
| — (new) | `packages/ops-ui/src/nav-link.tsx` |

`form-controls.tsx` currently imports `FormOption` from `@/types`. To keep `ops-ui`
dependency-free it declares its own structurally identical `Option = { label: string;
value: string }`. `FormOption` in `erp-config` remains assignable to it, so no call site
changes.

### `@pepbits/erp-config`

| From | To |
|---|---|
| `webapp/src/config/navigation.ts` | `packages/erp-config/src/navigation.ts` |
| `webapp/src/config/entity-schemas.ts` | `packages/erp-config/src/entity-schemas.ts` |
| `webapp/src/config/themes.ts` | `packages/erp-config/src/themes.ts` |
| `webapp/src/config/i18n.ts` | `packages/erp-config/src/i18n.ts` |
| `webapp/src/types/index.ts` | `packages/erp-config/src/types.ts` |

### `@pepbits/erp-data`

| From | To |
|---|---|
| `webapp/src/data/mock.ts` | `packages/erp-data/src/mock.ts` |

### `@pepbits/erp-shell`

| From | To |
|---|---|
| `webapp/src/components/layout/enterprise-shell.tsx` | `packages/erp-shell/src/enterprise-shell.tsx` |
| `webapp/src/components/layout/header.tsx` | `packages/erp-shell/src/header.tsx` |
| `webapp/src/components/layout/sidebar.tsx` | `packages/erp-shell/src/sidebar.tsx` |
| `webapp/src/components/layout/footer.tsx` | `packages/erp-shell/src/footer.tsx` |
| `webapp/src/context/erp-context.tsx` | `packages/erp-shell/src/erp-context.tsx` |
| `enterprise-app.tsx` → `CommandPalette` | `packages/erp-shell/src/layers/command-palette.tsx` |
| `enterprise-app.tsx` → `ToastViewport` | `packages/erp-shell/src/layers/toast-viewport.tsx` |
| `enterprise-app.tsx` → `HelpAssistant` | `packages/erp-shell/src/layers/help-assistant.tsx` |
| `enterprise-app.tsx` → `DocumentationDrawer` | `packages/erp-shell/src/layers/documentation-drawer.tsx` |

`erp-context.tsx` loses two groups of members:

- **Tab state** → moves to the desktop MDI implementation: `tabs`, `activeTabId`,
  `activeTab`, `openPage`, `closeTab`, `activateTab`, `closeOtherTabs`,
  `makeDashboardTab`, `dashboardPage`.
- **Module state** → becomes derived, per "Module switching" in section 7:
  `currentModule`, `setModule`, and the `module` convenience field. Consumers read
  `MODULES[PAGE_REGISTRY[navigation.current.pageId].module]`.

Everything else stays shared and unchanged: preferences and their persistence, branch,
role, toasts, the command/help/documentation flags, and `t()`. `ERPProvider` gains one
required prop, `navigation: NavigationPort`, and the global keydown handler moves with it
(with defects 4 and 5 corrected).

### `@pepbits/erp-screens`

| From | To |
|---|---|
| `webapp/src/components/worklist/*` (6 files) | `packages/erp-screens/src/worklist/` |
| `webapp/src/components/forms/*` (2 files) | `packages/erp-screens/src/forms/` |
| `webapp/src/components/dashboard/module-dashboard.tsx` | `packages/erp-screens/src/dashboard/` |
| `webapp/src/components/billing/billing-page.tsx` | `packages/erp-screens/src/billing/` |
| `webapp/src/components/reports/reports-page.tsx` | `packages/erp-screens/src/reports/` |
| `enterprise-app.tsx` → `PreferencesPage`, `ChoiceGroup`, `PreferenceSection` | `packages/erp-screens/src/preferences/` |
| `enterprise-app.tsx` → `SpreadsheetPage` | `packages/erp-screens/src/spreadsheet/` |
| `enterprise-app.tsx` → `LibraryPage`, `COMPONENT_ROWS` | `packages/erp-screens/src/library/` |
| `enterprise-app.tsx` → `PageRenderer` | `packages/erp-screens/src/page-renderer.tsx` |

`PageRenderer` currently reads `activeTab` from context to decide mode and record. It
changes signature to take an explicit target:

```ts
export function PageRenderer({ target }: { target: NavigationTarget }): JSX.Element
```

Web supplies it from route params; desktop supplies it from the active MDI tab. The
`switch (page.kind)` body is unchanged.

`EnterpriseApp` itself dissolves — each application composes its own root.

### `@pepbits/platform-ports`

New package. Section 7.

### `apps/desktop` (not shared)

| From | To |
|---|---|
| `webapp/src/components/layout/workspace-tabs.tsx` | `apps/desktop/src/mdi/workspace-tabs.tsx` |
| tab state removed from `erp-context.tsx` | `apps/desktop/src/mdi/use-mdi-navigation.ts` |

## 6. Web application

### Route tree

```
apps/web/src/app/
├── layout.tsx                                  imports @pepbits/tokens, mounts providers
├── page.tsx                                    redirects to the persisted module dashboard
├── [module]/[page]/page.tsx                    list / dashboard / reports / billing / …
├── [module]/[page]/new/page.tsx                mode: "new"
├── [module]/[page]/[recordId]/page.tsx         mode: "view"
└── [module]/[page]/[recordId]/edit/page.tsx    mode: "edit"
```

Four route files serve all ~200 entries in `PAGE_REGISTRY`.

### Resolution and the canonical guard

Each route resolves `PAGE_REGISTRY[page]` and then:

1. If the page is absent → `notFound()`.
2. If `PAGE_REGISTRY[page].module !== module` → `redirect()` to the canonical URL.
   The canonical module segment is `page.module`, or the literal `shared` where
   `page.module === "shared"` (covering `preferences`, `spreadsheet-studio` and the
   Developer Library pages).
3. Otherwise render `<PageRenderer target={{ pageId, mode, recordId }} />`.

This makes `/hr/customer-master` a writable URL that redirects to
`/finance/customer-master` rather than rendering a page under a module that does not own
it.

### Module state

The active module is derived from the URL, not held as state — see "Module switching" in
section 7, which covers both shells. The `nexora-module` localStorage key is retained
solely to decide where `/` redirects.

### Files superseded rather than moved

`webapp/app/layout.tsx` and `webapp/app/page.tsx` are not moved. `apps/web` gets its own
`layout.tsx` (importing `@pepbits/tokens` and mounting `ERPProvider` with the web
navigation implementation) and its own `page.tsx` (the `/` redirect). Likewise
`webapp/next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json`,
`next-env.d.ts`, `package.json` and `README.md` become `apps/web`'s, with
`transpilePackages` added to `next.config.ts` and compiler options extending
`tsconfig.base.json`. `webapp/.gitignore` is superseded by a root `.gitignore`.

## 7. The navigation seam

```ts
// packages/platform-ports/src/navigation.ts

export interface NavigationTarget {
  pageId: string;
  mode?: "view" | "edit" | "new";
  recordId?: string;
  title?: string;
}

export interface NavigationPort {
  /** Where the user is now. Drives the sidebar highlight and the header title.
      `useNavigation()` THROWS when no provider is mounted — a silent no-provider
      fallback produces a shell that looks fine and navigates nowhere. This follows
      `@pepbits/platform-ports`' `usePlatform()` next door, and deliberately not
      `useDensity()`/`useToast()`, which fail silently and are consequently mounted
      nowhere real in production. */
  current: NavigationTarget;

  /** Open the target the way this shell opens things by default.
      Web: navigate in place. Desktop: reuse the matching tab, else append one.
      Used by the sidebar, module switcher, breadcrumbs and command palette. */
  open(target: NavigationTarget): void;

  /** Force a NEW container regardless of what is already open:
      a new browser tab on web, an additional MDI tab on desktop.
      Used by worklist View / Edit / New, Alt+N, and dashboard queue rows. */
  openInNewContext(target: NavigationTarget): void;

  /** A real href for the target, so every row can be a proper anchor.
      Desktop returns "#" and relies on the click handler. */
  hrefFor(target: NavigationTarget): string;
}
```

### Web implementation — `apps/web/src/platform/web-navigation.ts`

| Member | Implementation |
|---|---|
| `current` | `useParams()` resolved through `PAGE_REGISTRY` |
| `open` | `router.push(hrefFor(target))` |
| `openInNewContext` | `window.open(hrefFor(target), "_blank", "noopener")` |
| `hrefFor` | `/{module}/{pageId}` + `/{recordId}` when present + `/edit` or `/new` per mode |

### Desktop implementation — `apps/desktop/src/mdi/use-mdi-navigation.ts`

| Member | Implementation |
|---|---|
| `current` | the active tab |
| `open` | today's `openPage` dedupe path: activate the tab whose id matches, otherwise append one |
| `openInNewContext` | today's `forceNewTab` path: always append, defects 3–4 corrected |
| `hrefFor` | `"#"` |

Desktop's `open` **appends** rather than replacing. That is deliberate: it is exactly
what `openPage` does today, and constraint 3 requires desktop behaviour to be unchanged.
The two members differ only in whether an existing matching tab is reused.

### Module switching

`currentModule` is not independent state in either shell. It is derived:
`PAGE_REGISTRY[navigation.current.pageId].module`. The header module switcher calls
`nav.open({ pageId: dashboardPageOf(module) })` and each shell applies its own semantics:

- **Web** pushes the dashboard URL. The sidebar re-renders from the new module.
- **Desktop** sees the target's module differs from the current one and resets the tab
  set to that module's dashboard — today's `setModule` behaviour, preserved.

This keeps the port at four members and removes `setModule`, `currentModule` and
`setCurrentModule` from the shared context entirely.

### `NavLink`

One new component in `ops-ui` absorbs the markup difference:

```tsx
export function NavLink({ href, onClick, className, children, ...rest }: NavLinkProps) {
  if (href && href !== "#") {
    return <a href={href} onClick={onClick} className={className} {...rest}>{children}</a>;
  }
  return <button type="button" onClick={onClick} className={className} {...rest}>{children}</button>;
}
```

It takes the caller's `className` verbatim and adds a fixed reset —
`no-underline cursor-pointer text-left` — so the `<a>` branch renders identically to the
`<button>` branch. Call sites pass `href={nav.hrefFor(target)}` and
`onClick={() => nav.openInNewContext(target)}` (or `open`, per the site).

This is the only markup change in the entire migration and the only genuine pixel risk.
It is verified explicitly in section 9.

## 8. Desktop application

```
apps/desktop/
├── index.html
├── vite.config.ts             react plugin, server.port 3001
├── tailwind.config / postcss  Tailwind 4, same as web
├── src/
│   ├── main.tsx
│   ├── mdi/
│   │   ├── workspace-tabs.tsx
│   │   └── use-mdi-navigation.ts
│   └── platform/
└── src-tauri/                 Tauri 2 (@tauri-apps/cli ^2, @tauri-apps/api ^2)
```

Root composition:

```tsx
<ERPProvider navigation={mdiNavigation}>
  <EnterpriseShell>
    <WorkspaceTabs />
    <PageRenderer target={mdiNavigation.current} />
  </EnterpriseShell>
</ERPProvider>
```

Tailwind stays at version 4 in both applications, so there is no Tailwind version split
to reconcile. (`allyvora-desktop` next door runs Tailwind 3; that is not copied here.)

Toolchain verified present on this machine: `rustc` / `cargo` 1.96.1, Xcode Command Line
Tools at `/Applications/Xcode.app/Contents/Developer`. Tauri 2 is driven through the
`@tauri-apps/cli` npm package, so no global `cargo-tauri` install is required.

## 9. Preserving presentation

### 9.1 Accepted visual deltas

Exactly two things look different on web, both required by the navigation model you asked
for. Everything else must be pixel-identical, and any third difference is a defect.

1. **The workspace tab strip is absent on web.** `WorkspaceTabs` is desktop-only. The
   `--tabbar-height` band between the header and the main region is reclaimed by the main
   region.
2. **The "Open records in tabs" preference control is absent on web.** It governs MDI tab
   creation, which web does not have. The control renders on desktop, where it is wired
   for the first time (defect 6, section 10). The `openRecordsInTabs` field stays in
   `UserPreferences` so the two shells share one persisted preferences shape.

3. **The sidebar overlays the page on hover instead of pushing it** (both shells,
   added 2026-09-03 on request). Collapsed and pinned behaviour is unchanged: the rail
   still occupies its width, and pinning still pushes the content. Only hover expansion
   differs — the panel is now `absolute inset-y-0` over the page with `--shadow-lg`,
   while an in-flow spacer holds the layout at the collapsed width. This matches
   `packages/portal-shell` in pepcare, where `.sb` is `position: fixed`, `.sb.open.overlay`
   carries the rail shadow, and `.shell-main` only gains `.pushed` while pinned.

   Consequence worth knowing: Nexora's sidebar is full height with the header in the
   column beside it, so an expanded overlay covers the header's leftmost region. The
   sidebar's own brand block is exactly `--header-height` tall, so the two align.

4. **The header identity is the signed-in account** (both shells, added 2026-09-03 on
   request, alongside the demo auth API). "Prakash Mathew" / `prakash@nexora.example` /
   `PM` were hardcoded; they now come from `@pepbits/auth`'s session, as do the initial
   role and branch selections. Signing in as `admin` reproduces the old hardcoded values
   exactly, so that account is visually identical to the pre-auth shell.

Deltas 1 and 2 do not apply to desktop, which is otherwise pixel-identical to `webapp`.
Delta 3 applies to both shells. Note that `verify-parity` does not cover `sidebar.tsx` —
it is a deliberately rewritten file, not a moved one, so this change is recorded here
rather than caught there.

### 9.2 The Tailwind 4 source-scanning trap

Tailwind 4 scans the project root by default. Once class strings live in
`packages/*/src`, an application that does not declare those directories as sources will
purge every class it does not find locally, and the application renders unstyled. Each
application's entry stylesheet must therefore declare them explicitly:

```css
@import "tailwindcss";
@source "../../../packages/ops-ui/src";
@source "../../../packages/erp-shell/src";
@source "../../../packages/erp-screens/src";
@import "@pepbits/tokens/tokens.css";
```

This is the single most likely cause of a catastrophic-looking visual regression during
the migration, and the first thing to check if one appears.

Three findings from the `pepcare-platform` frontend confirm this is not hypothetical:

- Adding one `@source` line for `packages/ops-ui/src` there was worth roughly **80
  previously-ungenerated utility classes, 29 on `Button` alone**. The theme import
  supplies token *names*; `@source` puts the package into the content scan. Both are
  required, and neither substitutes for the other.
- A package stylesheet whose payload is a Tailwind `@theme` block **compiles, builds,
  deploys and emits nothing** unless it is processed by a stylesheet that imports
  Tailwind. This design sidesteps that failure entirely: `@pepbits/tokens` ships plain
  `:root` custom properties, exactly as `webapp/app/globals.css` writes them today. No
  `@theme`, no generated adapters, no build step. (The equivalent package next door emits
  three artefacts; two of them have zero consumers repo-wide.)
- A missing `transpilePackages` entry is a **build failure**, not a warning, because
  `@pepbits/*` packages ship raw TypeScript with no build step.

### 9.3 Verification

Screenshot comparison of the pre-migration `webapp` against `apps/web`, across all seven
themes for: module dashboard, worklist (table), worklist (cards), record form in each of
the three navigation modes (rail, tabs, wizard), record preview in each of the four modes,
billing workspace, reports, preferences, spreadsheet studio, developer library.

Two options, to be chosen at implementation time:

- **Playwright screenshot diff** — a dev-only dependency, gives a zero-diff gate that can
  be re-run. Recommended, but it is a new library and therefore requires explicit
  approval under constraint 2.
- **Manual side-by-side** — no new dependency. Run the baseline from commit `9ae218a` on
  one port and the migrated web application on another, and compare by eye.

## 10. Defects corrected during the move

These are confirmed defects in the current tab implementation. They are corrected as part
of the move rather than patched in code about to be deleted. All are behavioural, none
are visual.

| # | Defect | Correction |
|---|---|---|
| 1 | The home tab's id (`${module}-home`) is outside `openPage`'s id namespace (`${pageId}:${mode}:${recordId}`), so clicking the dashboard menu item opens a duplicate dashboard tab. | Home tab is created through the same target-to-id function as every other tab. |
| 2 | `openPage` reassigns `currentModule` for a cross-module page without rebuilding the home tab, stranding the previous module's non-closable tab in the bar. | Desktop derives the home tab from the active target's module. |
| 3 | Forced tabs are keyed by `Date.now()`, so two opens inside one millisecond collide on id — producing duplicate React keys, and `closeTab` then removes both. | Monotonic counter. |
| 4 | `Alt+N` has no `event.repeat` guard, so holding the chord appends a tab per repeat event. | Guard on `event.repeat`. |
| 5 | `Alt+N` and `Alt+S` match `event.key`, which is the tilde dead key on macOS Option layouts, so the shortcuts are dead there. | Match `event.code` (`"KeyN"`, `"KeyS"`). |
| 6 | `preferences.openRecordsInTabs` is rendered in the preferences UI but read by no code path. | Desktop wires it to `openInNewContext`. Web hides the control (accepted delta 2, section 9.1), since the browser owns tab creation there. |
| 7 | The dashboard "Open full worklist" button builds page ids that do not exist for finance, hr and sales, so the click is a silent no-op. | Ids corrected against `PAGE_REGISTRY`; an unknown id logs rather than failing silently. |

A latent eighth issue — `openPage` reads `tabs` from the render closure while appending
through a functional updater — is resolved incidentally, because the MDI reducer performs
the existence check inside the updater. It does not fire today under real clicks, but
would under a `useEffect`-driven open.

## 11. Pre-work: the baseline does not type-check

`npm run build` in `webapp` at commit `9ae218a` compiles under Turbopack and then **fails
type checking** with three errors:

| File | Error |
|---|---|
| `src/components/layout/sidebar.tsx:51` | `'item.children' is possibly 'undefined'` |
| `src/components/ui/form-controls.tsx:33` | `cn()` rejects `0`, a legal `React.ReactNode` value of `prefix` |
| `src/components/worklist/data-table.tsx:13` | `unknown` is not assignable to `ReactNode` |

All three are type-only and pixel-neutral. They must be fixed first, so that a green build
exists to compare the migration against. Fixes:

1. `item.children?.map(...)` — also a real null-safety fix, since the guard above only
   returns early when `item.pageId` is set.
2. `prefix ? "pl-11" : undefined` and `suffix ? "pr-10" : undefined`.
3. `{String(value)}%`.

## 12. Order of work

1. **Fix the three type errors** on `feat/monorepo-tauri`; confirm `npm run build` is
   green. This is the comparison baseline.
2. **Capture the visual baseline** using the method chosen in section 9.
3. **Scaffold the workspace root**: `package.json` with the `apps/*` / `packages/*`
   globs, `turbo.json`, `tsconfig.base.json`, a root `.gitignore`.
4. **Create the seven packages** — `package.json`, `tsconfig.json`, `index.ts` barrel each.
5. **`git mv` files per section 5**; rewrite `@/…` imports to `@pepbits/…`.
6. **Stand up `apps/web`** with the route tree and the canonical guard; `webapp/`
   disappears. Verify build and visual parity.
7. **Extract `NavigationPort`**; implement for web; remove tab state from `erp-shell`;
   introduce `NavLink` at every navigating call site. Verify visual parity again — this
   is the step that can move a pixel.
8. **Stand up `apps/desktop`** with Vite, Tailwind, the MDI reducer and `src-tauri`.
   Verify the desktop shell behaves as `webapp` does today, with the section 10
   corrections.
9. **Verify the whole workspace**: `turbo run build`, `turbo run lint`, visual gate.

Steps 6, 7 and 8 each end in a working, committable state.

## 13. Risks and open items

| Risk | Mitigation |
|---|---|
| Tailwind 4 purges package classes; the application renders unstyled. | `@source` directives, section 9. Checked at step 6 before anything else is attributed to the migration. |
| `<button>` → `<a>` shifts a pixel at some call site. | `NavLink` carries a fixed reset; step 7 has its own visual gate. |
| `xlsx@0.18.5` carries CVE-2023-30533 and CVE-2024-22363 and rides along into `erp-screens`. | Out of scope under constraint 2. Recorded here so it is not lost; the fixed build is published from `cdn.sheetjs.com`, not npm. |
| `next-env.d.ts` and `tsconfig.json` show as modified because a dev server rewrote them. | Commit or discard before step 3 so the move diff is readable. |
| Turborepo and Tauri are new to this repository. | Turborepo mirrors a configuration already running in `pepcare-platform/frontend/provider-web`. Tauri does not — see the D5 correction; this is the first working instance of package sharing across a Next/Vite pair in either repository. |
| **A shell package gets forked instead of shared.** Next door, `apps/portal` forked `@pepbits/portal-shell` into its own tree and the two have since drifted by 179 lines of CSS and 54 lines of header markup, leaving the package with no product consumer at all. | The identical failure is available here the moment `apps/web` or `apps/desktop` needs a chrome tweak. Rule for this work: a shell change goes into `@pepbits/erp-shell` behind a prop, or it does not happen. No copy of `header.tsx` / `sidebar.tsx` may exist under `apps/`. |
| A package is created and never consumed. | Next door, `@pepbits/api-client`, `@pepbits/config`, `@pepbits/types` and `@pepbits/observability` are declared but called by nothing, and an entire `domain-ui` capability has zero importers. All seven packages here have a named consumer on day one; if one ends the migration with no importer, delete it rather than keep it. |

## 14. Non-goals

- No backend, API layer or real data. Mock data stays mock data.
- No authentication, routing guards or permissions.
- No test suite. There are no tests today; adding a unit-test runner is not part of this
  work. The only verification added is the visual gate in section 9.
- No visual redesign, no component API redesign, no dependency upgrades.
- No fix for the `xlsx` advisories.
