# Patient Record preference consolidation

Date: 9 September 2026. Status: implemented locally, not committed, pushed or deployed.

## Changed behavior

Patient Record no longer duplicates theme, layout and density controls in its footer. Existing My Preferences settings control the page. The Page tab now separates Spacing and corners from Typography and exposes all three existing densities. The Behaviour tab uses the shared Select for record layout with explanatory localized help. Record actions remain conditional on record state and permissions.

All changes use existing preference keys, policy resolution and persistence. The shared control wrapper disables managed/unavailable settings; the Preferences change handler also guards those conditions. No schema or API migration is required. Public workspace slots remain compatible.

## How to use and integrate

See [Patient Record appearance settings](../../features/library-preferences.md#patient-record-appearance-settings). Hosts continue supplying effective preferences and policy through the existing workspace contract. No new dependencies or storage are introduced.

## Verification

On the current working tree:

- `npx vitest run packages/erp-screens/src/preferences/preferences.test.tsx packages/erp-screens/src/clinical-templates/clinical-templates.test.tsx packages/erp-screens/src/templates/preference-compliance.test.tsx`: 13 tests passed across 3 files. Covers central layout/density updates, all three densities, live locks, unavailable preferences, patient edit/retry behavior and managed template presentation.
- `npm run typecheck`: passed for all configured packages and desktop application.
- Localization, shared-components, Library preference and generated template example gates: passed.

Commands above run from desktop-clients. Earlier browser evidence belongs to the prior delivery; no browser, native executable, build, deployment or native-speaker acceptance is claimed for this follow-up. New Arabic, Hindi and Malayalam help is catalogued but awaits native-speaker review. Historical in-app release snapshots are preserved; this follow-up's user guidance is in the repository feature guide.

## Source identity

Base commit: `82656eeedf809c8419bd6e2ae4674580cb3ff71a` plus uncommitted changes. The earlier manifest remains historical. SHA-256 values below identify this follow-up's principal source and new tests, not the complete repository. `clinical-templates/record-preferences.tsx` was removed; canonical localization catalogs and regenerated fallbacks also changed.

```text
8cf9c89281c6b3de4a0d5c6fb136cbc4233fcde5f4102c479fb4848871401f5f  desktop-clients/packages/erp-screens/src/clinical-templates/library-page.tsx
0635aa451998d68563206d3c9d7d3c354b41d7e8d325f247351d1df74a63fe91  desktop-clients/packages/erp-screens/src/preferences/index.tsx
d7538711876a3640c8f251cce2685b101545afb39d413647a822fc96db18f3a1  desktop-clients/packages/erp-screens/src/preferences/preferences.test.tsx
```
