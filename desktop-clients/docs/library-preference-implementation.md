# Library preference implementation and validation

9 September 2026. Covers the 129 unique destinations in the Library sidebar. This document follows the [original audit](library-preference-audit.md).

## What changed

| Audit finding | Correction |
| --- | --- |
| F1: local controls bypass presentation locks | Shared `PreferenceHost` and `usePreferenceChoice` contracts resolve managed values, reject locked/unavailable changes, and synchronize live preference/policy changes. Library layout controls use the central preference service. List and query page-size controls expose their disabled state. |
| F2: tables ignore settings | A dependency-free `PresentationProvider` in ops-ui supplies managed density, stripes, wrapping and sticky headers. Shared Table and DataTable consume it; managed cell CSS overrides fixed consumer padding. Spacious density is supported. Selected rows retain their selection appearance. |
| F3: fixed demo formatting | Catalog money, date, number, statistics and inline-edit examples use the current ERP formatter. Table/pagination demos use central preference updates and locks. Generated examples were refreshed. |
| F4: typography and radius | Clinical form/result regions use separate font scales. Fixed clinical text sizes and rectangular radii use preference tokens. Library typography utilities and rounded surfaces follow the chosen scale/radius. |
| F5: query behavior | Query and detail keyboard listeners obey the shortcut preference. Exports use CSV or Excel according to preference. Preview supports left/right drawers, centered card and modal. The optional inline view remains available only when preview policy permits changes. |
| F6: generic destinations | Six dedicated pages replace the old generic fallback: Theme Studio, Accessibility, Page Catalog, Component Contracts, Keyboard Shortcuts and Integration Guide. Their new explanatory text is registered in English, Arabic, Hindi and Malayalam. |
| F7: enforcement gaps | A shared Library route manifest, static verification gate, runtime component tests, and registered browser suite now cover the relevant contracts. API navigation parity is checked automatically. |

Theme Studio and Accessibility use actual user preferences, with the same administrator locks as My Preferences. Page Catalog uses the available product pages. Component Contracts links real source/component entries to their demonstrations. Keyboard Shortcuts reads the existing registry. Integration Guide explains providers, scope, adapters, policy and release checks.

## How settings reach a page

1. The existing ERP provider reads the preference snapshot and tenant policy from the API and resolves the effective settings.
2. PageRenderer places authorized pages inside the UI presentation provider. Library membership comes from the sidebar manifest, including shared destinations that have a different canonical module.
3. Shared tables consume those effective settings. Their presentation cannot silently revert to a fixed demo density or stripe setting.
4. Reusable template and clinical workspaces accept the same preference/policy contract. They also resolve locked values for standalone integrations.
5. Preference controls either call the host's update handler or maintain an unlocked local demonstration choice. A policy change immediately takes precedence over a previous local choice.

The UI provider does not import ERP, authentication or API clients. Data adapters and authorization remain outside primitives. No production backend or real patient integration was introduced.

## How to integrate a reusable page

Continue supplying the workspace's definition, record scope, data and authorized adapter. Also pass these properties from the existing ERP context:

```tsx
const {
  preferences,
  preferencePolicy,
  preferencesAvailable,
  updatePreference,
} = useERP();

<PageTemplateWorkspace
  definition={definition}
  scope={scope}
  initialDocument={record}
  adapter={adapter}
  preferences={preferences}
  preferencePolicy={preferencePolicy}
  preferencesAvailable={preferencesAvailable}
  onPreferenceChange={updatePreference}
/>
```

ClinicalPatientWorkspace accepts the same host properties. `PreferenceHost` is exported from `@pepbits/erp-screens`. The Library's copyable template and clinical examples show these connections and use public package imports.

For a generic UI integration outside the ERP shell, wrap shared tables in `PresentationProvider` with resolved presentation values. Resolve tenant policy in the host application; this UI contract is not a substitute for server authorization. For standalone demo workspaces, omitting the optional policy/callback preserves the existing local demo behavior.

## Validation

- All 1,485 tests across 101 test files passed. After final demo-formatting changes, the affected Library and query suites passed again (16 tests).
- All 97 named templates were rendered under compact and spacious managed table profiles in component tests.
- All 12 catalog destinations and six dedicated reference pages were rendered in component tests. Tests cover currency, policy changes while mounted, locked page size, query shortcuts and selected export format.
- All 129 Library destinations passed browser navigation and managed-presentation checks in the desktop shell using Chromium, the web shell using Chromium, and the desktop shell using Firefox. These runs also checked template/query locks and clinical previews, with no uncaught page errors.
- The full verification command passed, including localization, shared-component/form-control rules, generated examples, API route parity and browser-suite registration.
- Production web and desktop builds passed. The full package TypeScript check passed.
- A focused compact-density browser run also passed computed form/result font-scale and zero-radius assertions. Visual inspection led to keeping status badges on one line while ordinary table text wraps; the shared-component suite passed after that correction (11 tests).

The browser runs used an isolated local demo API with temporary storage. Preference requests were intercepted per browser context so tests did not change actual tenant policies or user preferences. They were local test runs, not checks of a newly deployed release.

## Running the new checks

Use the project's Node 24 environment:

```sh
npm run verify:library-preferences
npx vitest run packages/erp-screens/src/templates/preference-compliance.test.tsx packages/erp-screens/src/library/preference-compliance.test.tsx
E2E_API=http://127.0.0.1:3209 E2E_DESKTOP=http://127.0.0.1:3109 node e2e/library-preferences.ts
```

The browser suite is registered in the feature group. Set `PLAYWRIGHT_PATH` if Playwright is not installed locally. `E2E_BROWSER` selects Chromium, Firefox or WebKit; `E2E_DENSITY` selects a density profile. `E2E_LIBRARY_PAGES` can restrict a diagnostic run to comma-separated Library IDs; default runs cover the entire manifest. The test API must explicitly allow the chosen local shell origin.

## Verification limits

The audited implementation gaps are addressed. This is not a guarantee that every possible preference combination or future application is defect-free. Specialized examples still demonstrate their named component or layout; a calendar remains a calendar, and a skeleton example remains a skeleton even if runtime loading placeholders are disabled.

WebKit could not launch in this environment because required system libraries were absent. The native Tauri executable and native-speaker wording review were not tested in this change. These are verification limits, not passed checks. The changes have not been committed, pushed or deployed as part of this request.
