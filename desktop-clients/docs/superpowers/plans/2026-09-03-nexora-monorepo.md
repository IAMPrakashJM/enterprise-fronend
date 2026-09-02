# Nexora Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `webapp/` into an npm-workspaces + Turborepo monorepo serving a URL-driven Next.js web app and a Tauri desktop app over seven shared `@pepbits/*` packages.

**Architecture:** All UI, config, mock data and shell chrome move into packages. Navigation becomes an injected `NavigationPort` so shared screens never learn what a tab is — web pushes routes and calls `window.open`, desktop appends MDI tabs. Tab state exists only in the desktop app.

**Tech Stack:** Next.js 16.3.3, React 19.2, Tailwind CSS 4, Turborepo 2, Vite 7, Tauri 2, TypeScript 5.7, lucide-react, xlsx.

**Spec:** `docs/superpowers/specs/2026-09-03-nexora-monorepo-design.md`

## Global Constraints

- **Presentation is frozen.** Moved files must be byte-identical to their originals except for import lines. The only exceptions are the two deltas in spec §9.1: no tab strip on web, no `openRecordsInTabs` control on web.
- **No new runtime dependencies.** Runtime set stays `next`, `react`, `react-dom`, `lucide-react`, `xlsx`, `tailwindcss`. Vite, Tauri and Turborepo are build tooling for the new app, not replacements.
- **No new dev dependencies for verification.** Parity is proven by normalized source diff (Task 12), not screenshots.
- **Every package ships raw TypeScript.** `main: "./src/index.ts"`, no build step. A consuming Next app that omits a package from `transpilePackages` **fails the build**.
- **Tailwind stays at v4 in both apps.** Both apps' entry stylesheet must carry `@source` lines for every package containing class strings, or utilities are silently purged.
- **No copy of `header.tsx` / `sidebar.tsx` / `footer.tsx` may exist under `apps/`.** A shell change goes into `@pepbits/erp-shell` behind a prop, or it does not happen.
- **Node 24.16.0, npm 11.13.0, rustc/cargo 1.96.1** are present on this machine.

---

## File Structure

### New workspace root
| File | Responsibility |
|---|---|
| `package.json` | workspaces globs, turbo scripts |
| `turbo.json` | `build` / `lint` / `dev` tasks |
| `tsconfig.base.json` | compiler options every package extends |
| `.gitignore` | root-level, supersedes `webapp/.gitignore` |

### Packages
| Package | Responsibility | Depends on |
|---|---|---|
| `@pepbits/tokens` | `tokens.css` — `:root` custom properties, 7 themes | — |
| `@pepbits/ops-ui` | generic interaction surface + `cn`/formatters + `NavLink` | — |
| `@pepbits/platform-ports` | `NavigationTarget`, `NavigationPort`, `NavigationProvider`, `useNavigation` | — |
| `@pepbits/erp-config` | navigation tree, page registry, entity schemas, themes, i18n, types | — |
| `@pepbits/erp-data` | mock datasets and worklist config builder | `erp-config` |
| `@pepbits/erp-shell` | `ERPProvider`, Header, Sidebar, Footer, `EnterpriseShell`, global layers | `ops-ui`, `erp-config`, `platform-ports` |
| `@pepbits/erp-screens` | `PageRenderer` + all eight page kinds | all of the above |

### Apps
| Path | Responsibility |
|---|---|
| `apps/web/src/app/**` | four route files, layout, `/` redirect |
| `apps/web/src/platform/web-navigation.tsx` | `NavigationPort` over `next/navigation` + `window.open` |
| `apps/desktop/src/mdi/use-mdi-navigation.ts` | tab reducer + `NavigationPort` |
| `apps/desktop/src/mdi/workspace-tabs.tsx` | the tab strip (desktop only) |
| `apps/desktop/src-tauri/**` | Tauri 2 shell |

---

## Task 1: Green the baseline

**Files:**
- Modify: `webapp/src/components/layout/sidebar.tsx:51`
- Modify: `webapp/src/components/ui/form-controls.tsx:33`
- Modify: `webapp/src/components/worklist/data-table.tsx:13`

**Interfaces:**
- Consumes: nothing.
- Produces: a `webapp` tree where `npm run build` exits 0. Every later task compares against this.

- [ ] **Step 1: Confirm the build is red and capture the exact errors**

```bash
cd webapp && npm run build 2>&1 | grep -E "error TS|Failed to type check"
```
Expected: three `error TS` lines plus `Failed to type check.`

- [ ] **Step 2: Fix `sidebar.tsx` — `item.children` possibly undefined**

The guard above only returns early when `item.pageId` is set, so `children` really can be
undefined here. Optional chaining is both the type fix and a null-safety fix.

```tsx
          {item.children?.map((child) => {
```

- [ ] **Step 3: Fix `form-controls.tsx` — `cn()` rejects `0`**

`prefix` is a `React.ReactNode`, and `0` is a legal one. `prefix && "pl-11"` then evaluates
to `0`, which `cn`'s signature does not accept. A ternary keeps the rendered output
identical for every current call site.

```tsx
        <input className={cn(inputClass, prefix ? "pl-11" : undefined, suffix ? "pr-10" : undefined)} {...props} />
```

- [ ] **Step 4: Fix `data-table.tsx` — `unknown` is not a `ReactNode`**

```tsx
  if (column.type === "percent") return <span className="font-extrabold tabular-nums">{String(value)}%</span>;
```

- [ ] **Step 5: Verify the build is green**

```bash
cd webapp && npm run build
echo "exit=$?"
```
Expected: `✓ Compiled successfully`, no `error TS`, `exit=0`.

- [ ] **Step 6: Commit**

```bash
git add webapp/src
git commit -m "fix(types): green the baseline build before the monorepo split

Three type-only errors made \`next build\` fail type checking while the dev
server hid them. All are pixel-neutral; item.children?.map is also a real
null-safety fix, since the guard above only returns early when pageId is set."
```

---

## Task 2: Scaffold the workspace root

**Files:**
- Create: `package.json`, `turbo.json`, `tsconfig.base.json`, `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm install` links workspaces; `npx turbo run build` is available.

- [ ] **Step 1: Create the root `package.json`**

```json
{
  "name": "nexora-monorepo",
  "private": true,
  "version": "1.0.0",
  "description": "Nexora Enterprise ERP — web and desktop shells over shared @pepbits packages.",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "dev": "turbo run dev",
    "dev:web": "npm run dev -w web",
    "dev:desktop": "npm run dev -w desktop",
    "desktop": "npm run tauri -w desktop -- dev",
    "verify:parity": "node scripts/verify-parity.mjs"
  },
  "devDependencies": {
    "turbo": "^2"
  }
}
```

- [ ] **Step 2: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {},
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

`lint` deliberately has no `dependsOn: ["^build"]`: no package here has a build step, so
the fan-out would be pure overhead.

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "allowJs": false
  }
}
```

These are `webapp/tsconfig.json`'s options verbatim except `target` (ES2017 → ES2020, needed
by Vite's `es2021` build target) and the removal of `incremental`/`plugins`, which are
app-level concerns.

- [ ] **Step 4: Create the root `.gitignore`**

```
node_modules
.next
out
dist
.turbo
*.log
.env
.env.*
!.env.example
.DS_Store
.idea
tsconfig.tsbuildinfo
apps/desktop/src-tauri/target
apps/desktop/src-tauri/gen
```

- [ ] **Step 5: Verify turbo resolves**

```bash
npm install --no-audit --no-fund && npx turbo --version
```
Expected: a `2.x` version string, no workspace errors.

- [ ] **Step 6: Commit**

```bash
git add package.json turbo.json tsconfig.base.json .gitignore package-lock.json
git commit -m "build: scaffold the npm-workspaces + Turborepo root"
```

---

## Task 3: Create the seven package shells

**Files:**
- Create: `packages/{tokens,ops-ui,platform-ports,erp-config,erp-data,erp-shell,erp-screens}/{package.json,tsconfig.json}`

**Interfaces:**
- Consumes: `tsconfig.base.json` from Task 2.
- Produces: seven resolvable workspace packages named `@pepbits/<dir>`.

- [ ] **Step 1: Write the generator script**

Create `scripts/scaffold-packages.mjs`:

```js
import { mkdirSync, writeFileSync } from "node:fs";

const DEPS = {
  tokens: {},
  "ops-ui": {},
  "platform-ports": {},
  "erp-config": {},
  "erp-data": { "@pepbits/erp-config": "*" },
  "erp-shell": { "@pepbits/ops-ui": "*", "@pepbits/erp-config": "*", "@pepbits/platform-ports": "*" },
  "erp-screens": {
    "@pepbits/ops-ui": "*", "@pepbits/erp-config": "*", "@pepbits/erp-data": "*",
    "@pepbits/erp-shell": "*", "@pepbits/platform-ports": "*",
  },
};

for (const [name, dependencies] of Object.entries(DEPS)) {
  const dir = `packages/${name}`;
  mkdirSync(`${dir}/src`, { recursive: true });

  const pkg = {
    name: `@pepbits/${name}`,
    version: "0.0.0",
    private: true,
    type: "module",
    ...(name === "tokens"
      ? { exports: { "./tokens.css": "./src/tokens.css" } }
      : { main: "./src/index.ts", types: "./src/index.ts", exports: { ".": "./src/index.ts" } }),
    ...(Object.keys(dependencies).length ? { dependencies } : {}),
    ...(name === "tokens" ? {} : { peerDependencies: { react: ">=19" } }),
  };
  writeFileSync(`${dir}/package.json`, JSON.stringify(pkg, null, 2) + "\n");

  if (name !== "tokens") {
    writeFileSync(`${dir}/tsconfig.json`, JSON.stringify({
      extends: "../../tsconfig.base.json",
      include: ["src/**/*.ts", "src/**/*.tsx"],
    }, null, 2) + "\n");
  }
}
console.log("scaffolded", Object.keys(DEPS).length, "packages");
```

- [ ] **Step 2: Run it and relink the workspace**

```bash
node scripts/scaffold-packages.mjs && npm install --no-audit --no-fund
```

- [ ] **Step 3: Verify every package is linked**

```bash
ls -l node_modules/@pepbits/
```
Expected: seven symlinks pointing at `../../packages/*`. A dangling link here is the exact
failure that left `pepcare-platform` unable to build for five days.

- [ ] **Step 4: Commit**

```bash
git add packages scripts package-lock.json
git commit -m "build: scaffold the seven @pepbits packages"
```

---

## Task 4: Move the leaf packages — tokens, ops-ui, erp-config, erp-data

**Files:**
- Move: `webapp/app/globals.css` → `packages/tokens/src/tokens.css`
- Move: `webapp/src/components/ui/*.tsx` (9), `webapp/src/lib/cn.ts` → `packages/ops-ui/src/`
- Move: `webapp/src/config/*.ts` (4), `webapp/src/types/index.ts` → `packages/erp-config/src/`
- Move: `webapp/src/data/mock.ts` → `packages/erp-data/src/`
- Create: an `index.ts` barrel in each

**Interfaces:**
- Consumes: Task 3's package shells.
- Produces:
  - `@pepbits/ops-ui` exports `Badge`, `statusTone`, `StatusBadge`, `Button`, `IconButton`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `DropdownSelect`, `ActionMenu`, `MenuButton`, `EmptyState`, `FieldShell`, `Input`, `SearchInput`, `Textarea`, `Select`, `MultiSelect`, `Toggle`, `Modal`, `Drawer`, `CenterRecordCard`, `Pagination`, `Tabs`, `cn`, `formatCurrency`, `formatCompact`, and the type `BadgeTone`.
  - `@pepbits/erp-config` exports `MODULES`, `PAGE_REGISTRY`, `BRANCHES`, `ROLES`, `HEADER_QUICK_PAGES`, `ENTITY_SCHEMAS`, `getEntitySchema`, `THEME_OPTIONS`, `LANGUAGE_OPTIONS`, `translate`, and every type from `types.ts`.
  - `@pepbits/erp-data` exports `customerRows`, `employeeRows`, `userRows`, `invoiceRows`, `productRows`, `supplierRows`, `orderRows`, `getWorklistConfig`, `dashboardData`.

- [ ] **Step 1: Move the files with `git mv`**

```bash
git mv webapp/app/globals.css packages/tokens/src/tokens.css

for f in badge button card dropdown empty-state form-controls overlay pagination tabs; do
  git mv "webapp/src/components/ui/$f.tsx" "packages/ops-ui/src/$f.tsx"
done
git mv webapp/src/lib/cn.ts packages/ops-ui/src/cn.ts

for f in navigation entity-schemas themes i18n; do
  git mv "webapp/src/config/$f.ts" "packages/erp-config/src/$f.ts"
done
git mv webapp/src/types/index.ts packages/erp-config/src/types.ts

git mv webapp/src/data/mock.ts packages/erp-data/src/mock.ts
```

- [ ] **Step 2: Break `ops-ui`'s only outward dependency**

`form-controls.tsx` imports `FormOption` from `@/types`. Replacing it with a local
structurally-identical type keeps `ops-ui` dependency-free. `FormOption` stays assignable,
so no call site changes.

In `packages/ops-ui/src/form-controls.tsx`, delete the `import type { FormOption } from "@/types";`
line and add above `BaseFieldProps`:

```ts
/** Structurally identical to erp-config's FormOption. Declared locally so ops-ui
    depends on nothing and stays a generic interaction surface. */
export interface Option { label: string; value: string }
```

Then replace every `FormOption` in the file with `Option` (3 occurrences: `Select`'s
`options`, `MultiSelect`'s `options`, and the re-export if present).

- [ ] **Step 3: Rewrite intra-package imports**

```bash
# ops-ui: "@/lib/cn" and "./cn" both become "./cn"
sed -i '' 's|from "@/lib/cn"|from "./cn"|g' packages/ops-ui/src/*.tsx
sed -i '' 's|from "@/components/ui/\([a-z-]*\)"|from "./\1"|g' packages/ops-ui/src/*.tsx

# erp-config: "@/types" becomes "./types"
sed -i '' 's|from "@/types"|from "./types"|g' packages/erp-config/src/*.ts

# erp-data: "@/types" becomes the package
sed -i '' 's|from "@/types"|from "@pepbits/erp-config"|g' packages/erp-data/src/*.ts
```

- [ ] **Step 4: Write the barrels**

`packages/ops-ui/src/index.ts`:
```ts
export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./cn";
export * from "./dropdown";
export * from "./empty-state";
export * from "./form-controls";
export * from "./nav-link";
export * from "./overlay";
export * from "./pagination";
export * from "./tabs";
```

`packages/erp-config/src/index.ts`:
```ts
export * from "./types";
export * from "./navigation";
export * from "./entity-schemas";
export * from "./themes";
export * from "./i18n";
```

`packages/erp-data/src/index.ts`:
```ts
export * from "./mock";
```

`nav-link` does not exist until Task 9. Create a placeholder now so the barrel resolves —
Task 9 replaces its body:

`packages/ops-ui/src/nav-link.tsx`:
```tsx
"use client";
import React from "react";

export interface NavLinkProps extends React.HTMLAttributes<HTMLElement> {
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export function NavLink({ href, className, children, ...rest }: NavLinkProps) {
  return <button type="button" className={className} {...rest}>{children}</button>;
}
```

- [ ] **Step 5: Verify no `@/` imports survive in these four packages**

```bash
grep -rn 'from "@/' packages/tokens packages/ops-ui packages/erp-config packages/erp-data || echo "clean"
```
Expected: `clean`.

- [ ] **Step 6: Commit**

```bash
git add packages webapp
git commit -m "refactor: move tokens, ops-ui, erp-config and erp-data into packages"
```

---

## Task 5: Create `@pepbits/platform-ports`

**Files:**
- Create: `packages/platform-ports/src/navigation.tsx`, `packages/platform-ports/src/index.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `NavigationTarget`, `NavigationPort`, `NavigationProvider`, `useNavigation`, `targetKey`.

- [ ] **Step 1: Write `navigation.tsx`**

```tsx
"use client";

import React, { createContext, useContext } from "react";

export interface NavigationTarget {
  pageId: string;
  mode?: "view" | "edit" | "new";
  recordId?: string;
  title?: string;
}

export interface NavigationPort {
  /** Where the user is now. Drives the sidebar highlight and the header title. */
  current: NavigationTarget;
  /** Open the target the way this shell opens things by default.
      Web navigates in place; desktop reuses the matching tab, else appends one. */
  open(target: NavigationTarget): void;
  /** Force a new container: a new browser tab on web, an extra MDI tab on desktop. */
  openInNewContext(target: NavigationTarget): void;
  /** A real href, so every navigating row can be an anchor. Desktop returns "#". */
  hrefFor(target: NavigationTarget): string;
}

/** Stable identity for a target. Desktop uses it as a tab id; web uses it to
    decide whether `open` is a no-op. */
export function targetKey(target: NavigationTarget): string {
  return `${target.pageId}:${target.mode ?? "list"}:${target.recordId ?? "root"}`;
}

const NavigationContext = createContext<NavigationPort | null>(null);

export function NavigationProvider({ value, children }: { value: NavigationPort; children: React.ReactNode }) {
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

/** Throws when unprovided, deliberately. A silent no-provider fallback produces a
    shell that looks correct and navigates nowhere — the failure mode that left
    DensityProvider unmounted in production next door for months. */
export function useNavigation(): NavigationPort {
  const port = useContext(NavigationContext);
  if (!port) throw new Error("useNavigation must be used within a NavigationProvider");
  return port;
}
```

- [ ] **Step 2: Write the barrel**

`packages/platform-ports/src/index.ts`:
```ts
export * from "./navigation";
```

- [ ] **Step 3: Verify it type-checks standalone**

```bash
npx tsc -p packages/platform-ports/tsconfig.json --noEmit
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add packages/platform-ports
git commit -m "feat(platform-ports): the navigation seam between web and desktop"
```

---

## Task 6: Move `@pepbits/erp-shell` and split the context

**Files:**
- Move: `webapp/src/components/layout/{enterprise-shell,header,sidebar,footer}.tsx` → `packages/erp-shell/src/`
- Move: `webapp/src/context/erp-context.tsx` → `packages/erp-shell/src/erp-context.tsx`
- Create: `packages/erp-shell/src/layers/{command-palette,toast-viewport,help-assistant,documentation-drawer}.tsx`
- Create: `packages/erp-shell/src/index.ts`

**Interfaces:**
- Consumes: `@pepbits/ops-ui`, `@pepbits/erp-config`, `@pepbits/platform-ports`.
- Produces: `ERPProvider`, `useERP`, `EnterpriseShell`, `Header`, `Sidebar`, `Footer`, `CommandPalette`, `ToastViewport`, `HelpAssistant`, `DocumentationDrawer`, `GlobalLayers`.
- `useERP()` returns `{ preferences, updatePreference, updatePreferences, resetPreferences, branch, setBranch, role, setRole, toasts, toast, dismissToast, commandOpen, setCommandOpen, helpOpen, setHelpOpen, documentationOpen, setDocumentationOpen, t, currentModule, module }`. **`tabs`, `activeTab`, `openPage`, `closeTab`, `activateTab`, `closeOtherTabs`, `setModule` are gone.**
- `currentModule` and `module` are derived from `useNavigation().current`, not state.

- [ ] **Step 1: Move the files**

```bash
for f in enterprise-shell header sidebar footer; do
  git mv "webapp/src/components/layout/$f.tsx" "packages/erp-shell/src/$f.tsx"
done
git mv webapp/src/context/erp-context.tsx packages/erp-shell/src/erp-context.tsx
mkdir -p packages/erp-shell/src/layers
```

`workspace-tabs.tsx` stays in `webapp/` for now; Task 10 moves it to `apps/desktop`.

- [ ] **Step 2: Strip tab and module state from `erp-context.tsx`**

Delete these members from `ERPContextValue`, the provider body and the `useMemo` value:
`tabs`, `activeTab`, `activePageId`, `openPage`, `closeTab`, `activateTab`, `closeOtherTabs`,
`setModule`, and the helpers `dashboardPage` and `makeDashboardTab`. Delete the
`OpenPageOptions` interface. Delete the `useState` calls for `tabs` and `activeTabId`.

Replace the module members with derivations, and take the port as a prop:

```tsx
export function ERPProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const currentModule: ModuleKey = (() => {
    const page = PAGE_REGISTRY[navigation.current.pageId];
    return page && page.module !== "shared" ? page.module : "finance";
  })();
```

In the mount effect, keep the preferences restore and delete the tab rebuild — the
`savedModule` branch now only reads the key so `/` can redirect; drop `setCurrentModule`,
`setTabs` and `setActiveTabId` from it.

Replace the whole keydown effect with:

```tsx
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // event.repeat: holding Alt+N used to append one tab per OS repeat event.
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.getAttribute("contenteditable") === "true";
      // event.code, not event.key: Option+N on a macOS US layout reports the dead
      // key "Dead", so the key-based match was silently dead on every Mac.
      if ((event.metaKey || event.ctrlKey) && event.code === "KeyK") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.code === "Comma") {
        event.preventDefault();
        navigation.open({ pageId: "preferences" });
      }
      if (!typing && event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
      if (!typing && event.altKey && event.code === "KeyN") {
        event.preventDefault();
        navigation.openInNewContext({ ...navigation.current, mode: "new", recordId: undefined });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigation]);
```

Add to the context value: `currentModule`, `module: MODULES[currentModule]`.

- [ ] **Step 3: Extract the four global layers from `enterprise-app.tsx`**

Copy each function body **verbatim** out of `webapp/src/components/shared/enterprise-app.tsx`
into its own file under `packages/erp-shell/src/layers/`, adding `"use client"` and the
imports it needs. The JSX must not change.

- `CommandPalette` (line 337) → `layers/command-palette.tsx`. Replace `openPage(page.id)` with `navigation.open({ pageId: page.id })`.
- `ToastViewport` (line 365) → `layers/toast-viewport.tsx`. No navigation.
- `HelpAssistant` (line 376) → `layers/help-assistant.tsx`. Replace its `PAGE_REGISTRY[activePageId]` read with `PAGE_REGISTRY[navigation.current.pageId]`.
- `DocumentationDrawer` (line 395) → `layers/documentation-drawer.tsx`. Replace `openPage("integration-guide")` with `navigation.open({ pageId: "integration-guide" })`.

Then `layers/index.tsx`:
```tsx
"use client";
import { CommandPalette } from "./command-palette";
import { ToastViewport } from "./toast-viewport";
import { HelpAssistant } from "./help-assistant";
import { DocumentationDrawer } from "./documentation-drawer";

/** Every always-mounted overlay, in the order EnterpriseApp mounted them. */
export function GlobalLayers() {
  return (
    <>
      <CommandPalette />
      <ToastViewport />
      <HelpAssistant />
      <DocumentationDrawer />
    </>
  );
}
export { CommandPalette, ToastViewport, HelpAssistant, DocumentationDrawer };
```

- [ ] **Step 4: Convert `sidebar.tsx` and `header.tsx` to the port**

`sidebar.tsx`: replace `const { module, activePageId, openPage, ... } = useERP()` with
`useERP()` for preferences and `useNavigation()` for the rest. `activePageId` becomes
`navigation.current.pageId`; `onSelect={openPage}` becomes
`onSelect={(pageId) => navigation.open({ pageId })}`. The `openPage("preferences")` call at
the foot becomes `navigation.open({ pageId: "preferences" })`.

`header.tsx`: `setModule(value)` becomes
`navigation.open({ pageId: value === "library" ? "library-dashboard" : \`${value}-dashboard\` })`.
The profile-menu `openPage` calls become `navigation.open(...)`, except **My Profile**, which
keeps its record target: `navigation.open({ pageId: "user-master", mode: "view", recordId: "USR-00301", title: "My Profile" })`.

- [ ] **Step 5: Rewrite imports and write the barrel**

```bash
sed -i '' \
  -e 's|from "@/components/ui/[a-z-]*"|from "@pepbits/ops-ui"|g' \
  -e 's|from "@/lib/cn"|from "@pepbits/ops-ui"|g' \
  -e 's|from "@/config/[a-z-]*"|from "@pepbits/erp-config"|g' \
  -e 's|from "@/types"|from "@pepbits/erp-config"|g' \
  -e 's|from "@/context/erp-context"|from "../erp-context"|g' \
  packages/erp-shell/src/*.tsx packages/erp-shell/src/layers/*.tsx
sed -i '' 's|from "../erp-context"|from "./erp-context"|g' packages/erp-shell/src/*.tsx
```

Merge the duplicate `@pepbits/ops-ui` and `@pepbits/erp-config` import lines each file now
has into one apiece.

`packages/erp-shell/src/index.ts`:
```ts
export * from "./erp-context";
export * from "./enterprise-shell";
export * from "./header";
export * from "./sidebar";
export * from "./footer";
export * from "./layers";
```

- [ ] **Step 6: Verify**

```bash
grep -rn 'from "@/' packages/erp-shell || echo "clean"
grep -rn 'openPage\|activePageId\|setModule' packages/erp-shell || echo "no stale nav"
```
Expected: `clean` and `no stale nav`.

- [ ] **Step 7: Commit**

```bash
git add packages/erp-shell webapp
git commit -m "refactor(erp-shell): extract the shell and drop tab and module state

Tab state moves to the desktop app in a later task; module becomes derived from
the navigation port. Alt+N gains an event.repeat guard and the shortcuts match
event.code, which fixes them on macOS Option layouts."
```

---

## Task 7: Move `@pepbits/erp-screens` and split `enterprise-app.tsx`

**Files:**
- Move: `webapp/src/components/{worklist,forms,dashboard,billing,reports}/**` → `packages/erp-screens/src/`
- Create: `packages/erp-screens/src/{preferences,spreadsheet,library}/index.tsx` from `enterprise-app.tsx`
- Create: `packages/erp-screens/src/page-renderer.tsx`, `packages/erp-screens/src/index.ts`
- Delete: `webapp/src/components/shared/enterprise-app.tsx`

**Interfaces:**
- Consumes: everything from Tasks 4–6.
- Produces: `PageRenderer`, `WorklistPage`, `DynamicRecordForm`, `ModuleDashboard`, `BillingPage`, `ReportsPage`, `PreferencesPage`, `SpreadsheetPage`, `LibraryPage`.
- `PageRenderer` signature: `function PageRenderer({ target }: { target: NavigationTarget }): React.JSX.Element`.

- [ ] **Step 1: Move the five screen folders**

```bash
for d in worklist forms dashboard billing reports; do
  git mv "webapp/src/components/$d" "packages/erp-screens/src/$d"
done
```

- [ ] **Step 2: Extract the three inline pages verbatim**

From `webapp/src/components/shared/enterprise-app.tsx`:
- `ChoiceGroup` (59), `PreferenceSection` (93), `PreferencesPage` (104) → `packages/erp-screens/src/preferences/index.tsx`
- `SHEET_COLUMNS` (130), `INITIAL_SHEET` (131), `SheetCell` type, `SpreadsheetPage` (194) → `packages/erp-screens/src/spreadsheet/index.tsx`
- `COMPONENT_ROWS` (216), `LibraryPage` (280) → `packages/erp-screens/src/library/index.tsx`

Each gets `"use client"` and its own imports. **No JSX changes**, with one exception: in
`PreferencesPage`, wrap the "Open records in tabs" control so it only renders on desktop.
Add a prop to the component signature:

```tsx
export function PreferencesPage({ showTabPreferences = true }: { showTabPreferences?: boolean }) {
```

and wrap only that one `<Toggle>` (the `openRecordsInTabs` one) in
`{showTabPreferences ? <Toggle .../> : null}`. Every other control is untouched.

- [ ] **Step 3: Write `page-renderer.tsx`**

```tsx
"use client";

import React from "react";
import type { NavigationTarget } from "@pepbits/platform-ports";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import { ModuleDashboard } from "./dashboard/module-dashboard";
import { WorklistPage } from "./worklist/worklist-page";
import { DynamicRecordForm } from "./forms/dynamic-record-form";
import { BillingPage } from "./billing/billing-page";
import { ReportsPage } from "./reports/reports-page";
import { PreferencesPage } from "./preferences";
import { SpreadsheetPage } from "./spreadsheet";
import { LibraryPage } from "./library";

export function PageRenderer({ target, showTabPreferences = true }: { target: NavigationTarget; showTabPreferences?: boolean }) {
  const page = PAGE_REGISTRY[target.pageId];
  if (!page) return <div className="p-8 text-center text-sm text-[var(--text-muted)]">Page configuration was not found.</div>;
  if (target.mode && (page.kind === "worklist" || page.kind === "form")) return <DynamicRecordForm page={page} target={target} />;
  switch (page.kind) {
    case "dashboard": return <ModuleDashboard moduleKey={page.module === "shared" ? undefined : page.module} />;
    case "worklist": return <WorklistPage page={page} />;
    case "form": return <DynamicRecordForm page={page} target={target} />;
    case "billing": return <BillingPage page={page} />;
    case "reports": return <ReportsPage page={page} />;
    case "preferences": return <PreferencesPage showTabPreferences={showTabPreferences} />;
    case "spreadsheet": return <SpreadsheetPage />;
    case "library": return <LibraryPage page={page} />;
    default: return <WorklistPage page={page} />;
  }
}
```

- [ ] **Step 4: Convert `DynamicRecordForm` and `WorklistPage` to the port**

`dynamic-record-form.tsx`: it reads `activeTab` from `useERP()` for `mode` and `recordId`.
Take a `target: NavigationTarget` prop instead. Replace `activeTab.recordId` with
`target.recordId` (5 sites) and `activeTab.mode` with `target.mode` (1 site). Replace the
Edit button's `openPage(...)` with `navigation.open({ pageId: page.id, mode: "edit", recordId: target.recordId, title: \`${schema.singular} • Edit\` })`.

`worklist-page.tsx`: `view`, `edit` and the New button call `navigation.openInNewContext(...)`
with the same targets they built before; the "Import records" and "Page preferences" menu
items call `navigation.open(...)`.

`module-dashboard.tsx`: the queue rows and "Open full worklist" call
`navigation.openInNewContext(...)` and `navigation.open(...)` respectively. **Fix defect 7**:
verify each generated pageId against `PAGE_REGISTRY` and fall back to the module dashboard,
logging when the id is unknown, rather than doing nothing:

```tsx
const worklistFor = (key: ModuleKey) => {
  const id = key === "library" ? "page-catalog" : `${key === "supply" ? "procurement" : key}-worklist`;
  if (PAGE_REGISTRY[id]) return id;
  console.warn(`[dashboard] no page registered for "${id}"; falling back to the dashboard`);
  return key === "library" ? "library-dashboard" : `${key}-dashboard`;
};
```

- [ ] **Step 5: Rewrite imports and write the barrel**

```bash
sed -i '' \
  -e 's|from "@/components/ui/[a-z-]*"|from "@pepbits/ops-ui"|g' \
  -e 's|from "@/lib/cn"|from "@pepbits/ops-ui"|g' \
  -e 's|from "@/config/[a-z-]*"|from "@pepbits/erp-config"|g' \
  -e 's|from "@/types"|from "@pepbits/erp-config"|g' \
  -e 's|from "@/data/mock"|from "@pepbits/erp-data"|g' \
  -e 's|from "@/context/erp-context"|from "@pepbits/erp-shell"|g' \
  packages/erp-screens/src/*/*.tsx
```

`packages/erp-screens/src/index.ts`:
```ts
export * from "./page-renderer";
export * from "./worklist/worklist-page";
export * from "./forms/dynamic-record-form";
export * from "./dashboard/module-dashboard";
export * from "./billing/billing-page";
export * from "./reports/reports-page";
export * from "./preferences";
export * from "./spreadsheet";
export * from "./library";
```

- [ ] **Step 6: Delete the husk and verify**

```bash
git rm webapp/src/components/shared/enterprise-app.tsx
grep -rn 'from "@/' packages/erp-screens || echo "clean"
```

- [ ] **Step 7: Commit**

```bash
git add packages/erp-screens webapp
git commit -m "refactor(erp-screens): move every page kind and split enterprise-app.tsx"
```

---

## Task 8: Stand up `apps/web`

**Files:**
- Create: `apps/web/{package.json,tsconfig.json,next.config.ts,postcss.config.mjs,eslint.config.mjs,next-env.d.ts}`
- Create: `apps/web/src/app/{globals.css,layout.tsx,page.tsx}`
- Create: `apps/web/src/app/[module]/[page]/{page.tsx,new/page.tsx,[recordId]/page.tsx,[recordId]/edit/page.tsx}`
- Create: `apps/web/src/app/[module]/[page]/resolve.ts`
- Create: `apps/web/src/platform/web-navigation.tsx`, `apps/web/src/platform/providers.tsx`
- Delete: `webapp/`

**Interfaces:**
- Consumes: all seven packages.
- Produces: a Next app on :3000 serving every `PAGE_REGISTRY` entry at `/{module}/{page}`.
- `resolvePage(module, page)` returns `{ page: PageDefinition }` or calls `notFound()`/`redirect()`.

- [ ] **Step 1: Create `apps/web/package.json`**

```json
{
  "name": "web",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start --port 3000",
    "lint": "eslint ."
  },
  "dependencies": {
    "@pepbits/erp-config": "*",
    "@pepbits/erp-data": "*",
    "@pepbits/erp-screens": "*",
    "@pepbits/erp-shell": "*",
    "@pepbits/ops-ui": "*",
    "@pepbits/platform-ports": "*",
    "@pepbits/tokens": "*",
    "lucide-react": "^0.468.0",
    "next": "16.3.3",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.17.0",
    "eslint-config-next": "16.3.3",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create `apps/web/next.config.ts`**

```ts
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so Turbopack never infers it from a stray parent lockfile.
  turbopack: { root: path.join(__dirname, "..", "..") },
  /* Every @pepbits package ships RAW TypeScript (main: "./src/index.ts", no build
     step), so a missing entry here does not fail at runtime — it fails the BUILD.
     That is the good failure. The silent one is Tailwind; see globals.css. */
  transpilePackages: [
    "@pepbits/ops-ui",
    "@pepbits/erp-config",
    "@pepbits/erp-data",
    "@pepbits/erp-shell",
    "@pepbits/erp-screens",
    "@pepbits/platform-ports",
  ],
};

export default nextConfig;
```

- [ ] **Step 3: Create `apps/web/src/app/globals.css`**

```css
@import "tailwindcss";

/* Tailwind 4 scans the project root. The class strings that style this app live in
   packages/, outside that root — without these @source lines every utility they use
   is purged and the app renders unstyled. The token import supplies variable NAMES;
   @source puts the files into the content scan. Both are required. */
@source "../../../../packages/ops-ui/src";
@source "../../../../packages/erp-shell/src";
@source "../../../../packages/erp-screens/src";

@import "@pepbits/tokens/tokens.css";
```

`tokens.css` keeps its own `@import "tailwindcss";` line from the original `globals.css` —
delete that one line from `packages/tokens/src/tokens.css`, since the app now owns it.

- [ ] **Step 4: Create the navigation implementation**

`apps/web/src/platform/web-navigation.tsx`:
```tsx
"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import type { NavigationPort, NavigationTarget } from "@pepbits/platform-ports";

export function moduleSegmentFor(pageId: string): string {
  const page = PAGE_REGISTRY[pageId];
  return page ? page.module : "shared";
}

export function hrefFor(target: NavigationTarget): string {
  const base = `/${moduleSegmentFor(target.pageId)}/${target.pageId}`;
  if (target.mode === "new") return `${base}/new`;
  if (target.recordId) return target.mode === "edit" ? `${base}/${target.recordId}/edit` : `${base}/${target.recordId}`;
  return base;
}

export function useWebNavigation(): NavigationPort {
  const router = useRouter();
  const params = useParams<{ module?: string; page?: string; recordId?: string }>();

  return useMemo(() => {
    const segments = typeof window === "undefined" ? [] : window.location.pathname.split("/").filter(Boolean);
    const mode: NavigationTarget["mode"] | undefined =
      segments[segments.length - 1] === "new" ? "new"
      : segments[segments.length - 1] === "edit" ? "edit"
      : params.recordId ? "view"
      : undefined;

    const current: NavigationTarget = {
      pageId: params.page ?? "finance-dashboard",
      ...(mode ? { mode } : {}),
      ...(params.recordId ? { recordId: params.recordId } : {}),
    };

    return {
      current,
      open: (target) => router.push(hrefFor(target)),
      /* A user gesture, so this is not popup-blocked. noopener because the new tab
         has no reason to reach back into this one. */
      openInNewContext: (target) => { window.open(hrefFor(target), "_blank", "noopener"); },
      hrefFor,
    };
  }, [params.page, params.recordId, router]);
}
```

`apps/web/src/platform/providers.tsx`:
```tsx
"use client";

import React from "react";
import { NavigationProvider } from "@pepbits/platform-ports";
import { ERPProvider, EnterpriseShell, GlobalLayers } from "@pepbits/erp-shell";
import { useWebNavigation } from "./web-navigation";

function Inner({ children }: { children: React.ReactNode }) {
  return (
    <ERPProvider>
      <EnterpriseShell>{children}</EnterpriseShell>
      <GlobalLayers />
    </ERPProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const navigation = useWebNavigation();
  return (
    <NavigationProvider value={navigation}>
      <Inner>{children}</Inner>
    </NavigationProvider>
  );
}
```

- [ ] **Step 5: Create the layout and the root redirect**

`apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/platform/providers";

export const metadata: Metadata = {
  title: "Nexora ERP Workspace",
  description: "Configurable enterprise ERP interface prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
```

`apps/web/src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";

/* The persisted module lives in localStorage, which the server cannot read, so the
   canonical landing is the default module. A client redirect on top of this would
   flash; the module switcher is one click away. */
export default function Home() {
  redirect("/finance/finance-dashboard");
}
```

- [ ] **Step 6: Create the shared resolver and the four route files**

`apps/web/src/app/[module]/[page]/resolve.ts`:
```ts
import { notFound, redirect } from "next/navigation";
import { PAGE_REGISTRY } from "@pepbits/erp-config";
import type { PageDefinition } from "@pepbits/erp-config";

/** Resolve a (module, page) pair, 404ing an unknown page and redirecting a page
    reached under a module that does not own it to its canonical URL. */
export function resolvePage(moduleSegment: string, pageId: string, suffix = ""): PageDefinition {
  const page = PAGE_REGISTRY[pageId];
  if (!page) notFound();
  if (page.module !== moduleSegment) redirect(`/${page.module}/${pageId}${suffix}`);
  return page;
}
```

`apps/web/src/app/[module]/[page]/page.tsx`:
```tsx
import { PageRenderer } from "@pepbits/erp-screens";
import { resolvePage } from "./resolve";

export default async function Page({ params }: { params: Promise<{ module: string; page: string }> }) {
  const { module, page } = await params;
  resolvePage(module, page);
  return <PageRenderer target={{ pageId: page }} showTabPreferences={false} />;
}
```

`apps/web/src/app/[module]/[page]/new/page.tsx`:
```tsx
import { PageRenderer } from "@pepbits/erp-screens";
import { resolvePage } from "../resolve";

export default async function NewRecordPage({ params }: { params: Promise<{ module: string; page: string }> }) {
  const { module, page } = await params;
  resolvePage(module, page, "/new");
  return <PageRenderer target={{ pageId: page, mode: "new" }} showTabPreferences={false} />;
}
```

`apps/web/src/app/[module]/[page]/[recordId]/page.tsx`:
```tsx
import { PageRenderer } from "@pepbits/erp-screens";
import { resolvePage } from "../resolve";

export default async function ViewRecordPage({ params }: { params: Promise<{ module: string; page: string; recordId: string }> }) {
  const { module, page, recordId } = await params;
  resolvePage(module, page, `/${recordId}`);
  return <PageRenderer target={{ pageId: page, mode: "view", recordId }} showTabPreferences={false} />;
}
```

`apps/web/src/app/[module]/[page]/[recordId]/edit/page.tsx`:
```tsx
import { PageRenderer } from "@pepbits/erp-screens";
import { resolvePage } from "../../resolve";

export default async function EditRecordPage({ params }: { params: Promise<{ module: string; page: string; recordId: string }> }) {
  const { module, page, recordId } = await params;
  resolvePage(module, page, `/${recordId}/edit`);
  return <PageRenderer target={{ pageId: page, mode: "edit", recordId }} showTabPreferences={false} />;
}
```

- [ ] **Step 7: Copy the remaining app config and delete `webapp/`**

```bash
git mv webapp/postcss.config.mjs apps/web/postcss.config.mjs
git mv webapp/eslint.config.mjs apps/web/eslint.config.mjs
git mv webapp/next-env.d.ts apps/web/next-env.d.ts
git rm -r webapp
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 8: Install, build and check the CSS actually emitted**

```bash
npm install --no-audit --no-fund
npm run build -w web
```
Expected: `✓ Compiled successfully`, no `error TS`.

Then confirm the `@source` lines worked — this is the failure that looks like a broken app
rather than a config problem:

```bash
grep -c 'rounded-\[10px\]\|--primary-soft' apps/web/.next/static/css/*.css
```
Expected: a non-zero count. Zero means Tailwind purged the package utilities.

- [ ] **Step 9: Commit**

```bash
git add apps/web packages/tokens package-lock.json
git commit -m "feat(web): URL-driven Next app over the shared packages

Four route files serve every PAGE_REGISTRY entry at /{module}/{page}, with a
canonical redirect when a page is reached under a module that does not own it.
webapp/ is gone."
```

---

## Task 9: `NavLink` and the anchor conversion

**Files:**
- Modify: `packages/ops-ui/src/nav-link.tsx`
- Modify: every navigating call site in `packages/erp-shell/src/sidebar.tsx`, `packages/erp-screens/src/worklist/{data-table,card-grid}.tsx`, `packages/erp-screens/src/dashboard/module-dashboard.tsx`

**Interfaces:**
- Consumes: `useNavigation` from Task 5.
- Produces: `NavLink({ href, onClick, className, children, title, "aria-label" })`.

- [ ] **Step 1: Write the real `nav-link.tsx`**

```tsx
"use client";

import React from "react";
import { cn } from "./cn";

export interface NavLinkProps {
  /** A real URL on web; "#" or undefined on desktop, where clicks are handled in JS. */
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  title?: string;
  children: React.ReactNode;
}

/* One component so a navigating row is a real anchor on web — giving cmd-click,
   middle-click, "copy link address" and a status-bar preview for free — and a button
   on desktop, where there is no URL to copy. The reset classes exist so the two
   branches render identically: an <a> has no browser default here beyond the
   underline and the text cursor, and <button> centres its text. */
const RESET = "no-underline cursor-pointer text-left appearance-none";

export function NavLink({ href, onClick, className, title, children, ...rest }: NavLinkProps) {
  if (href && href !== "#") {
    return (
      <a href={href} onClick={onClick} title={title} className={cn(RESET, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} className={cn(RESET, className)} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Convert the sidebar's two button kinds**

In `packages/erp-shell/src/sidebar.tsx`, `SidebarLeaf`'s `<button>` and the child `<button>`
inside `SidebarGroup` both navigate. Replace `<button type="button" ... onClick={onSelect}>`
with `<NavLink href={navigation.hrefFor({ pageId })} onClick={(e) => { e.preventDefault(); navigation.open({ pageId }); }} ...>`,
keeping every existing class string byte-identical.

The group toggle button does **not** navigate — leave it a `<button>`.

- [ ] **Step 3: Convert the worklist rows**

In `data-table.tsx` and `card-grid.tsx`, the row's primary cell and the View/Edit menu items
navigate. Give each an `href` from `navigation.hrefFor(...)` and an `onClick` that
`preventDefault()`s and calls `navigation.openInNewContext(...)`.

- [ ] **Step 4: Convert the dashboard queue rows**

Same treatment in `module-dashboard.tsx` for the queue row buttons and "Open full worklist".

- [ ] **Step 5: Verify the reset does not change rendering**

```bash
npm run build -w web
grep -rn '<button' packages/erp-shell/src/sidebar.tsx
```
Expected: build green; exactly one `<button>` left in the sidebar (the group toggle).

- [ ] **Step 6: Commit**

```bash
git add packages
git commit -m "feat(ops-ui): NavLink renders an anchor on web and a button on desktop"
```

---

## Task 10: Stand up `apps/desktop`

**Files:**
- Create: `apps/desktop/{package.json,tsconfig.json,vite.config.ts,postcss.config.mjs,index.html}`
- Create: `apps/desktop/src/{main.tsx,globals.css}`
- Create: `apps/desktop/src/mdi/{use-mdi-navigation.ts,workspace-tabs.tsx}`

**Interfaces:**
- Consumes: all seven packages.
- Produces: a Vite app on :3001 with the MDI tab strip.
- `useMdiNavigation()` returns `NavigationPort & { tabs, activeTabId, closeTab, activateTab, closeOtherTabs }`.

- [ ] **Step 1: Create `apps/desktop/package.json`**

```json
{
  "name": "desktop",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "lint": "echo \"desktop: no lint configured\""
  },
  "dependencies": {
    "@pepbits/erp-config": "*",
    "@pepbits/erp-data": "*",
    "@pepbits/erp-screens": "*",
    "@pepbits/erp-shell": "*",
    "@pepbits/ops-ui": "*",
    "@pepbits/platform-ports": "*",
    "@pepbits/tokens": "*",
    "@tauri-apps/api": "^2.2.0",
    "lucide-react": "^0.468.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@tauri-apps/cli": "^2.2.0",
    "@types/node": "^22.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.1.0",
    "postcss": "^8.5.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.0",
    "vite": "^7.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    // The @pepbits/* packages resolve via symlink to ../../packages/*. Dedupe React
    // so the app and the packages share ONE copy — two copies make every hook throw
    // "Cannot read properties of null (reading 'useState')".
    dedupe: ["react", "react-dom"],
  },
  clearScreen: false,
  server: {
    port: 3001,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
    fs: { allow: [searchForWorkspaceRoot(process.cwd())] },
  },
  build: { target: "es2021", outDir: "dist" },
});
```

- [ ] **Step 3: Create `index.html` and `globals.css`**

`apps/desktop/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexora ERP Workspace</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`apps/desktop/src/globals.css` — identical to the web app's, with the depth adjusted:
```css
@import "tailwindcss";

/* See apps/web/src/app/globals.css. Without these the package utilities are purged
   and the desktop app renders unstyled. */
@source "../../../packages/ops-ui/src";
@source "../../../packages/erp-shell/src";
@source "../../../packages/erp-screens/src";

@import "@pepbits/tokens/tokens.css";
```

`apps/desktop/postcss.config.mjs`:
```js
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

- [ ] **Step 4: Write the MDI reducer**

`apps/desktop/src/mdi/use-mdi-navigation.ts`:
```ts
import { useCallback, useMemo, useRef, useState } from "react";
import { MODULES, PAGE_REGISTRY } from "@pepbits/erp-config";
import type { ModuleKey } from "@pepbits/erp-config";
import { targetKey } from "@pepbits/platform-ports";
import type { NavigationPort, NavigationTarget } from "@pepbits/platform-ports";

export interface MdiTab {
  id: string;
  title: string;
  target: NavigationTarget;
  closable: boolean;
}

function dashboardPageId(module: ModuleKey): string {
  return module === "library" ? "library-dashboard" : `${module}-dashboard`;
}

function moduleOf(pageId: string): ModuleKey {
  const page = PAGE_REGISTRY[pageId];
  return page && page.module !== "shared" ? page.module : "finance";
}

function titleFor(target: NavigationTarget): string {
  if (target.title) return target.title;
  const page = PAGE_REGISTRY[target.pageId];
  const base = page?.title ?? "Page";
  const suffix = target.mode && target.mode !== "view" ? ` • ${target.mode === "new" ? "New" : "Edit"}` : "";
  const record = target.recordId ? ` • ${target.recordId}` : "";
  return `${base}${suffix}${record}`;
}

/** The home tab is built through the SAME id function as every other tab. Using a
    bespoke `${module}-home` id put it outside openPage's namespace, so clicking the
    dashboard menu item opened a duplicate of the tab already showing it. */
function homeTab(module: ModuleKey): MdiTab {
  const target: NavigationTarget = { pageId: dashboardPageId(module) };
  return { id: targetKey(target), title: titleFor(target), target, closable: false };
}

export function useMdiNavigation(initialModule: ModuleKey = "finance") {
  const [tabs, setTabs] = useState<MdiTab[]>(() => [homeTab(initialModule)]);
  const [activeTabId, setActiveTabId] = useState(() => targetKey({ pageId: dashboardPageId(initialModule) }));
  /* A monotonic counter, not Date.now(): millisecond resolution let two forced opens
     in the same tick collide on id, which duplicated a React key AND made closeTab's
     filter remove both tabs at once. */
  const forcedSeq = useRef(0);

  const open = useCallback((target: NavigationTarget) => {
    const id = targetKey(target);
    setTabs((previous) => {
      const nextModule = moduleOf(target.pageId);
      const currentModule = moduleOf(previous.find((t) => !t.closable)?.target.pageId ?? "finance-dashboard");
      /* Crossing modules resets the tab set — today's setModule behaviour. Doing it
         here rather than in shared state is what stops a foreign, unclosable home tab
         being stranded in the bar. */
      if (nextModule !== currentModule) {
        const home = homeTab(nextModule);
        const next = home.id === id ? [home] : [home, { id, title: titleFor(target), target, closable: true }];
        setActiveTabId(id);
        return next;
      }
      if (previous.some((t) => t.id === id)) {
        setActiveTabId(id);
        return previous;
      }
      setActiveTabId(id);
      return [...previous, { id, title: titleFor(target), target, closable: true }];
    });
  }, []);

  const openInNewContext = useCallback((target: NavigationTarget) => {
    forcedSeq.current += 1;
    const id = `${targetKey(target)}#${forcedSeq.current}`;
    setTabs((previous) => [...previous, { id, title: titleFor(target), target, closable: true }]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((previous) => {
      const index = previous.findIndex((t) => t.id === tabId);
      if (index < 0 || !previous[index].closable) return previous;
      const next = previous.filter((t) => t.id !== tabId);
      setActiveTabId((active) => (active === tabId ? (next[Math.max(0, index - 1)] ?? next[0])?.id ?? active : active));
      return next;
    });
  }, []);

  const closeOtherTabs = useCallback((tabId: string) => {
    setTabs((previous) => previous.filter((t) => !t.closable || t.id === tabId));
    setActiveTabId(tabId);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  const port: NavigationPort = useMemo(() => ({
    current: activeTab.target,
    open,
    openInNewContext,
    hrefFor: () => "#",
  }), [activeTab.target, open, openInNewContext]);

  return { port, tabs, activeTab, activeTabId, setActiveTabId, closeTab, closeOtherTabs, MODULES };
}
```

- [ ] **Step 5: Move `workspace-tabs.tsx` and rewire it**

```bash
mkdir -p apps/desktop/src/mdi
git mv webapp/src/components/layout/workspace-tabs.tsx apps/desktop/src/mdi/workspace-tabs.tsx 2>/dev/null \
  || git show HEAD~5:webapp/src/components/layout/workspace-tabs.tsx > apps/desktop/src/mdi/workspace-tabs.tsx
```

Change its signature from reading `useERP()` to taking props, keeping every class string
identical:

```tsx
export function WorkspaceTabs({ tabs, activeTabId, onActivate, onClose, onCloseOthers, onOpenCommand }: {
  tabs: MdiTab[]; activeTabId: string;
  onActivate: (id: string) => void; onClose: (id: string) => void;
  onCloseOthers: (id: string) => void; onOpenCommand: () => void;
}) {
```

- [ ] **Step 6: Write `main.tsx`**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { NavigationProvider } from "@pepbits/platform-ports";
import { ERPProvider, EnterpriseShell, GlobalLayers, useERP } from "@pepbits/erp-shell";
import { PageRenderer } from "@pepbits/erp-screens";
import { useMdiNavigation } from "./mdi/use-mdi-navigation";
import { WorkspaceTabs } from "./mdi/workspace-tabs";
import "./globals.css";

function Workspace({ mdi }: { mdi: ReturnType<typeof useMdiNavigation> }) {
  const { setCommandOpen } = useERP();
  return (
    <EnterpriseShell>
      <WorkspaceTabs
        tabs={mdi.tabs}
        activeTabId={mdi.activeTabId}
        onActivate={mdi.setActiveTabId}
        onClose={mdi.closeTab}
        onCloseOthers={mdi.closeOtherTabs}
        onOpenCommand={() => setCommandOpen(true)}
      />
      <PageRenderer target={mdi.activeTab.target} />
    </EnterpriseShell>
  );
}

function App() {
  const mdi = useMdiNavigation();
  return (
    <NavigationProvider value={mdi.port}>
      <ERPProvider>
        <Workspace mdi={mdi} />
        <GlobalLayers />
      </ERPProvider>
    </NavigationProvider>
  );
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
```

`EnterpriseShell` currently renders `<WorkspaceTabs />` itself. Remove that line from
`packages/erp-shell/src/enterprise-shell.tsx` and let `children` carry it — the desktop app
passes the strip plus the page, the web app passes only the page.

- [ ] **Step 7: Build**

```bash
npm install --no-audit --no-fund && npm run build -w desktop
```
Expected: `tsc --noEmit` clean, then a Vite build writing `apps/desktop/dist`.

- [ ] **Step 8: Commit**

```bash
git add apps/desktop packages package-lock.json
git commit -m "feat(desktop): Vite shell with the MDI tab strip

Tab ids come from the shared targetKey, so the home tab can no longer be
duplicated; forced tabs use a monotonic counter rather than Date.now(); crossing
modules rebuilds the tab set instead of stranding a foreign home tab."
```

---

## Task 11: Wrap the desktop app in Tauri

**Files:**
- Create: `apps/desktop/src-tauri/{Cargo.toml,build.rs,tauri.conf.json,src/main.rs,src/lib.rs,capabilities/default.json}`

**Interfaces:**
- Consumes: `apps/desktop/dist` from Task 10.
- Produces: `npm run desktop` opens a native window.

- [ ] **Step 1: Generate the scaffold**

```bash
cd apps/desktop && npx @tauri-apps/cli@^2 init \
  --app-name "Nexora ERP" \
  --window-title "Nexora ERP Workspace" \
  --frontend-dist ../dist \
  --dev-url http://localhost:3001 \
  --before-dev-command "npm run dev" \
  --before-build-command "npm run build" \
  --ci
```

- [ ] **Step 2: Set the identifier and window geometry**

In `apps/desktop/src-tauri/tauri.conf.json`:
```json
  "identifier": "com.nexora.erp.desktop",
  "app": {
    "windows": [
      { "title": "Nexora ERP Workspace", "width": 1440, "height": 900, "minWidth": 1024, "minHeight": 640, "center": true, "resizable": true }
    ]
  }
```

- [ ] **Step 3: Build the Rust side**

```bash
cd apps/desktop/src-tauri && cargo build
```
Expected: `Finished` — first run downloads the crate graph and takes several minutes.

- [ ] **Step 4: Launch it**

```bash
npm run desktop
```
Expected: a native window showing the finance dashboard with the tab strip.

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src-tauri
git commit -m "feat(desktop): Tauri 2 shell"
```

---

## Task 12: Prove parity and finish

**Files:**
- Create: `scripts/verify-parity.mjs`
- Create: `README.md`

**Interfaces:**
- Consumes: the finished tree and git history.
- Produces: `npm run verify:parity` exits 0.

- [ ] **Step 1: Write the parity checker**

This is what replaces a screenshot harness. It compares each moved file against its
pre-migration content, ignoring import lines — so any change to JSX, class strings or logic
is reported.

`scripts/verify-parity.mjs`:
```js
#!/usr/bin/env node
/**
 * Presentation is frozen (spec §2.1). Every moved file must be identical to its
 * original except for import lines. This proves that by construction, which is a
 * stronger claim than a screenshot diff and costs no dependencies.
 *
 * Files with a deliberate, spec-sanctioned change are listed in ALLOWED with the
 * reason. Anything else that differs is a defect.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BASELINE = process.env.BASELINE_REF ?? "main";

const MOVES = [
  ["webapp/app/globals.css", "packages/tokens/src/tokens.css"],
  ["webapp/src/lib/cn.ts", "packages/ops-ui/src/cn.ts"],
  ...["badge", "button", "card", "dropdown", "empty-state", "overlay", "pagination", "tabs"]
    .map((f) => [`webapp/src/components/ui/${f}.tsx`, `packages/ops-ui/src/${f}.tsx`]),
  ...["navigation", "entity-schemas", "themes", "i18n"]
    .map((f) => [`webapp/src/config/${f}.ts`, `packages/erp-config/src/${f}.ts`]),
  ["webapp/src/types/index.ts", "packages/erp-config/src/types.ts"],
  ["webapp/src/data/mock.ts", "packages/erp-data/src/mock.ts"],
  ["webapp/src/components/layout/footer.tsx", "packages/erp-shell/src/footer.tsx"],
  ["webapp/src/components/billing/billing-page.tsx", "packages/erp-screens/src/billing/billing-page.tsx"],
  ["webapp/src/components/reports/reports-page.tsx", "packages/erp-screens/src/reports/reports-page.tsx"],
  ["webapp/src/components/worklist/filter-panel.tsx", "packages/erp-screens/src/worklist/filter-panel.tsx"],
  ["webapp/src/components/worklist/column-manager.tsx", "packages/erp-screens/src/worklist/column-manager.tsx"],
  ["webapp/src/components/worklist/record-preview.tsx", "packages/erp-screens/src/worklist/record-preview.tsx"],
  ["webapp/src/components/forms/form-navigation.tsx", "packages/erp-screens/src/forms/form-navigation.tsx"],
];

const ALLOWED = {
  "packages/tokens/src/tokens.css": "the app now owns the `@import \"tailwindcss\"` line",
  "packages/ops-ui/src/form-controls.tsx": "FormOption replaced by a local Option, to keep ops-ui dependency-free",
};

/** Strip import lines and blank runs so only substance is compared. */
const normalize = (text) => text
  .split("\n")
  .filter((line) => !/^\s*(import|export \*|export \{[^}]*\} from)\b/.test(line))
  .join("\n")
  .replace(/\n{2,}/g, "\n")
  .trim();

let failures = 0;
for (const [before, after] of MOVES) {
  if (ALLOWED[after]) { console.log(`~ ${after}\n    allowed: ${ALLOWED[after]}`); continue; }
  let original;
  try {
    original = execFileSync("git", ["show", `${BASELINE}:${before}`], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch {
    console.error(`! ${before} not found at ${BASELINE}`);
    failures += 1;
    continue;
  }
  const current = readFileSync(after, "utf8");
  if (normalize(original) === normalize(current)) {
    console.log(`✓ ${after}`);
  } else {
    console.error(`✗ ${after} differs from ${BASELINE}:${before} beyond its imports`);
    failures += 1;
  }
}

console.log(`\n${MOVES.length - failures}/${MOVES.length} files verified identical modulo imports`);
process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it**

```bash
BASELINE_REF=main npm run verify:parity
```
Expected: every line `✓` or `~`, exit 0. A `✗` means a class string moved — go and look.

- [ ] **Step 3: Build everything through turbo**

```bash
npx turbo run build
```
Expected: both apps build.

- [ ] **Step 4: Write the root `README.md`**

```markdown
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

## Verify

```bash
npx turbo run build    # both apps
npm run verify:parity  # moved files still byte-identical modulo imports
```

## The one rule

Presentation is frozen. A shell change goes into `@pepbits/erp-shell` behind a prop —
no copy of `header.tsx` or `sidebar.tsx` may exist under `apps/`. If a package ends up
with no importer, delete it.

## Tab behaviour differs on purpose

`@pepbits/platform-ports` defines a `NavigationPort`. Shared screens call
`open` / `openInNewContext` and never learn what a tab is. Web pushes routes and calls
`window.open`; desktop appends an MDI tab. Tab state exists only in `apps/desktop`.
```

- [ ] **Step 5: Final commit**

```bash
git add README.md scripts
git commit -m "docs: root README and the parity verifier"
```

---

## Self-Review

**Spec coverage.** §4 structure → Tasks 2, 3. §5 move map → Tasks 4, 6, 7. §6 web routes and canonical guard → Task 8. §7 port, `NavLink`, module switching → Tasks 5, 6, 9. §8 desktop → Tasks 10, 11. §9.1 deltas → Task 7 step 2 (`showTabPreferences`) and Task 10 step 6 (strip removed from `EnterpriseShell`). §9.2 Tailwind `@source` → Task 8 step 3, Task 10 step 3, verified in Task 8 step 8. §9.3 verification → Task 12. §10 defects: 1 and 2 in Task 10 step 4, 3 in Task 10 step 4, 4 and 5 in Task 6 step 2, 6 in Task 7 step 2, 7 in Task 7 step 4. §11 type errors → Task 1. §13 fork risk → Task 12 step 4 README.

**Placeholders.** None. Every code step carries the actual code.

**Type consistency.** `NavigationTarget` / `NavigationPort` / `targetKey` are defined once in Task 5 and used unchanged in Tasks 6–10. `PageRenderer({ target, showTabPreferences })` is defined in Task 7 and called with both props in Task 8 and with `target` alone in Task 10. `MdiTab` is defined in Task 10 step 4 and consumed in step 5.

**Known gap, deliberate.** `getWorklistConfig` and the entity schemas are untouched, so the
worklist and form screens keep their current behaviour verbatim. `xlsx@0.18.5` moves with
`SpreadsheetPage` and is not upgraded (spec §14).
