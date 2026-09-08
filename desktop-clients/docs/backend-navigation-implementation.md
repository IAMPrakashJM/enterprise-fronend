# Backend navigation and localization implementation

Status: Backend navigation and expanded page-body localization, 8 September 2026.
See [page-body localization](./page-body-localization.md) for the latest copy coverage.

The shared frontend now loads application menus and the preferred language dictionary
from the authenticated dummy API. Language remains in My Preferences → Language &
help. Both web and desktop use `products/provider.tsx` for the same bootstrap.

## Implemented

- File-backed Nexora and Ledger navigation with stable node, parent, and page IDs.
- Authenticated `GET /navigation?productId=...` and
  `GET /localization?productId=...&language=...` endpoints.
- Server role filtering, product checks, configuration validation, revisions,
  private ETags, and gzip responses.
- Frontend response validation and intersection with installed product pages and
  icons. JSON never supplies executable components.
- Shared startup loading/error/retry behavior. Failed menu loading does not silently
  expose the static menu. Pending requests are cancelled when the session changes.
- API dictionaries loaded before the workspace mounts; language changes reuse
  them without changing document IDs or unmounting forms.
- Stable keys for sidebar/module labels, header titles, workspace page titles,
  dynamic form labels/sections/hints/placeholders, and table headings.
- Compatibility with existing English-source keys in common controls and legacy
  screens. Native navigation labels and page titles for Arabic, Hindi, Malayalam.
- Configuration audit reporting untranslated seeded catalog entries.

## Data flow

```text
Session + product
  → authenticated preferences/navigation requests + selected localization request
  → validate IDs, locale, product, tree and message shape
  → intersect API configuration with installed product pages
  → ProductProvider → ERPProvider → shared controls and page components
  → Preferences loads a requested dictionary before applying the change
```

The preferred language is loaded first; its response includes English fallback.
Other catalogs are fetched on demand and cached for the session. A failed switch
keeps the current preference. Workspace documents stay mounted. See the
[review follow-up](review-follow-up-2026-09-08.md) for implementation and checks.

## Where to edit

See [the backend configuration guide](../../dummy-api/config/README.md) for file
locations, examples, validation, restart behavior, and product customization.

Stable menu keys look like `menu.finance.customer-master.label`; page title keys
look like `page.customer-master.title`. The customer form uses
`field.customer.legalName.label`, and its table uses
`column.customer-master.id.label`. Labels change; stored IDs and record values do
not. API configuration takes effect after backend restart and client reload.

## Integration boundaries and follow-up

The page-body pass now translates the shared screen controls, schema copy,
consultation templates, dashboards, reports, billing and workflow dialogs.
See [the implementation guide](./page-body-localization.md) for the exact scope.

- Product-authored records, messages and unknown adapter errors retain their source
  content. Adapters should supply message keys and parameters for generated prose.
- Some English source-message keys remain for compatibility, particularly where
  old captions are also persisted identifiers. They are translated when displayed.
- Native-speaker terminology review, translator CSV tools, namespace loading and
  a last-good cache policy remain separate follow-up work.
- Broader production authorization hardening remains necessary for demo data APIs.

## Verification

```sh
node --test dummy-api/application-config.test.mjs dummy-api/application-config-http.test.mjs
node dummy-api/check-application-config.mjs --strict-navigation
npm --prefix desktop-clients run typecheck
npm --prefix desktop-clients test
npm --prefix desktop-clients run build
npm --prefix desktop-clients run verify
```

`desktop-clients/e2e/backend-navigation.mjs` expects an isolated API configuration
copy with these Nexora overrides: remove the `vendor-master` menu entry, set
`menu.finance.customer-master.label` to `عملاء من الخادم`,
`page.customer-master.title` to `صفحة العملاء من الخادم`,
`column.customer-master.id.label` to `المعرف من الخادم`, and
`field.customer.legalName.label` to `اسم المؤسسة من الخادم` in the Arabic product
catalog. Start the API with `NEXORA_CONFIG_DIR` pointing to the copy, use an isolated
`NEXORA_DATA_DIR` and `RECORD_DATA_DIR`, and run the desktop frontend on port 3109
against it. The test checks those visible changes and API-outage retry behavior.

Run `e2e/localization.mjs` with default config to check all four languages, both
sidebar positions, preference reload, and stable record IDs. Browser tests use the
existing Playwright harness and `E2E_DESKTOP` override.

## Release verification

Release `20260908061028372-32dd1c01` was prepared and activated on 8 September 2026.
The API was restarted with the validated configuration; its previous source and
the new configuration snapshot are retained under `.deploy/api-backups/`.

- 1,348 unit/component tests and four backend configuration/HTTP tests passed.
- All package typechecks, both builds, and repository verification checks passed.
- Browser tests verified file-driven menu removal and native menu/page/column/field
  overrides, preserved input values, API-outage retry, four languages, both sidebar
  placements, and preference reload.
- Public checks passed on both frontends, with preference writes intercepted.

## Page-body translation release — 8 September 2026

Release `20260908081742242-fb52a1fa` adds the page-body catalog migration,
translated dynamic captions and controls, and the static-copy regression check.
The API was restarted to load the updated catalogs; both frontend packages passed
isolated HTML/asset checks before activation. Previous release
`20260908061028372-32dd1c01` is retained for frontend rollback. API configuration
snapshots are retained under `.deploy/api-backups/`.

See [Page-body localization](page-body-localization.md) for coverage, validation,
a screenshot, integration instructions and the boundary between interface text
and record/service content.

## Follow-up release — 8 September 2026

`20260908095706252-a12ab449` adds API message descriptors, localized workbook
headings and invoice printing, and a native window-close race fix. See the
[completion report](localization-completion-report.md) for validation and the
remaining human-review/report-delivery requirements.
