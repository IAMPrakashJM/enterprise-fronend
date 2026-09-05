# Nexora Enterprise ERP

A data-heavy, multi-module ERP prototype. One shared component layer, two shells.

```
apps/web        Next.js 16 — every page is a URL; records open in browser tabs   :3100
apps/desktop    Vite 7 + Tauri 2 — records open in in-window workspace tabs      :3101
packages/*      @pepbits/* — the shared surface both shells render
```

## Run

```bash
npm install
npm run dev:stack      # demo API :3200 + web :3100   <- the usual one
npm run dev:all        # demo API + web + desktop
npm run dev:api        # demo API only  :3200
npm run dev:web        # web only       :3100
npm run dev:desktop    # desktop in a browser :3101
npm run desktop        # native Tauri window
npm run stop           # kill anything left on 3100/3101/3200
```

The one-liners background the API and trap `EXIT INT TERM`, so Ctrl+C should take it
down with the shells. If a port is ever still held — the symptom is Vite exiting with
`Port 3101 is already in use`, reported by turbo as a bare exit code — run
`npm run stop`. Running the API and the shell in two terminals avoids the question
entirely.

Both shells require the demo auth API. `dummy-api/` is a sibling of this workspace, not
a member of it, so turbo cannot start it — hence the separate `dev:api` script.

### Signing in

| Username | Password | Role |
|---|---|---|
| `user1` | `user1` | Finance Manager |
| `user2` | `user2` | Operations Analyst |
| `admin` | `admin` | Enterprise Administrator |

The login screen lists all three and fills the form when you pick one. The signed-in
account drives the header identity, the role selector and the branch selector.

**Preferences follow the account.** Everything on the My Preferences page — theme, fonts,
density, sidebar side, form navigation, record preview mode, toasts, language, page size
— is stored server-side per user and reloaded at sign-in. Only the values a user actually
changed are persisted; everything else stays at its default, so a preference added later
starts at its new default. Changes apply instantly and save 400 ms later.

The shell renders the splash until preferences arrive, so it never paints in one theme
and jumps to another. `localStorage` holds no preferences at all — two stores for one
setting is a reconciliation bug waiting to happen. Worklist column layout and sort are
still per-browser, since they are not My Preferences items.

The gate is client-side in both shells rather than a `/login` route: the token lives in
`localStorage`, the only store both shells share. Next middleware cannot read it, and a
cookie cannot reach the packaged Tauri app, which is a different origin. So signed out
on web you stay at the current URL and see the login screen there.

Requires Node 24+, and for the Tauri window a Rust toolchain and Xcode Command Line
Tools.

### If `dev` fails with `command sh -c vite` exited (1)

Vite runs with `strictPort: true`, because Tauri's `devUrl` is a fixed
`http://localhost:3101` and a shifting port would leave the native window pointed at
nothing. The cost is that a port already in use is a hard **exit 1**, not a fallback —
and turbo reports only the exit code, so the real line (`Port 3101 is already in use`)
is buried. Usually it is a dev server from an earlier session:

```bash
lsof -ti tcp:3100 tcp:3101 | xargs kill
```

## Verify

```bash
npm test                 # 116 component tests -- does the screen come out right?
npx turbo run build      # both apps
npm run verify:parity    # moved files still identical to the pre-migration originals
npm run verify:ai-gates  # the AI access rules, including the escalation cases
npm run verify:ai-credential  # a provider token never comes back (needs the API up)
npm run verify:ai-context     # assembly reads only what a use case names
npm run verify:ai-modes       # panel, terminal and inline share one engine
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
| `@pepbits/ai-config` | the eight AI access gates, the resolver, use cases, policy and admin shapes | — |
| `@pepbits/ai-client` | context assembly, redaction, policy fetch, the admin API | `ai-config`, `auth` |
| `@pepbits/ai-ui` | the assistant: panel, terminal, inline action, transparency | `ai-client`, `ai-config`, `ops-ui`, `erp-shell` |

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
- `docs/superpowers/specs/2026-09-03-contextual-ai-assistant-design.md` — the gated AI assistant, draft
- `docs/superpowers/plans/2026-09-03-contextual-ai-assistant.md` — its seven-task plan
- `docs/ui-gap-analysis.md` — what AllyVORA's provider-web has that this does not, with the cost and the case against each
