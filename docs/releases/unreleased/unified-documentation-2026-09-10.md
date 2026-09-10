# Shared help and documentation lifecycle — 10 September 2026

Local working tree on `2696b1b467743a4a21b9be142d88d74da9247090`; not committed, pushed or deployed. The previously pending billing rail changes remain in this working tree and are covered by the final component checks.

## Delivered behavior

Page Help opens documentation by default. Its article, the documentation drawer, Documentation Center and Page Library guides use the same authenticated API renderer, effective language and release. Tours load from the API rather than substituting separate local tour prose. Catalog articles work without bundled code examples. The effective documentation preference suppresses hidden article fetching.

The new `2026-09-10-unified-help` snapshot preserves earlier releases, migrates catalog integration prose into API guides and explains the billing entry/rail changes. API responses carry source and translation fingerprints, completeness/outdated status and separate review status. Source text, required-field metadata, tour changes or translated text can invalidate existing review evidence. Missing or outdated native copy remains visibly identified.

The [lifecycle guide](../../documentation/README.md) documents page scaffolding, mandatory new-page sections, stable tour targets, source-impact receipts, revision synchronization and review packets. CI and project verification enforce registration, receipts, translation drift and historical snapshot preservation. Strict acceptance also requires a cleared authoring/native-review backlog. Receipts record developer declarations; they do not automatically establish human review or branch protection.

## Tests and evidence

| Check | Result and scope |
| --- | --- |
| Component regressions | 39 tests across shell chrome, catalog, billing and clinical templates passed |
| Lifecycle/API contracts | 8 tests passed: impact fingerprints, source/translation/field-metadata invalidation and existing authenticated documentation API behavior |
| TypeScript and production builds | All packages and both shell builds passed |
| Project gates | Passed, including documentation lifecycle checks and 140 Library route parity |
| Unified help browser | Catalog and contextual Help display matching API content in en/ar/hi/ml; direction, metadata and no JavaScript errors passed |
| Documentation Center browser | Guides, API-driven patch list, release archive, notice section, reading state and ar/hi/ml passed |
| Strict acceptance | Expected failure: 1,059 backlog entries remain; this is not an all-reviewed release |

Browser checks used Chromium at 1700 × 1050 with Vite on 3109 and an isolated disposable API on 3210. They did not read or write live patient records. The [manifest](evidence/unified-documentation/manifest.json) identifies source hashes, retained logs, test scope and post-browser guide-only changes. Screenshots: [English](evidence/unified-documentation/en.png), [Arabic](evidence/unified-documentation/ar.png), [Hindi](evidence/unified-documentation/hi.png), [Malayalam](evidence/unified-documentation/ml.png).

Documentation links, checker tests and whitespace validation passed. No remote CI success, native executable test, native-language approval, deployment or published package is claimed. The earlier documentation browser expectation of an empty patch list was replaced with the actual API manifest; unrelated previous CI failures remain outside this delivery.

## Remaining work and recovery

The [backlog](../../documentation/backlog.json) records 168 reference-only guides plus 891 page/language review entries. Of those language entries, 537 have incomplete translation coverage and 354 have current but unreviewed text. Domain owners must author/verify missing workflows and native reviewers must review the translated content. Strict acceptance intentionally fails until that work is complete. Branch protection/reviewer assignment is external administrative work and was not configured here.

There is no business-data migration or new access bypass. Documentation reading-state storage is unchanged. API/client release pointers must move together when this work is eventually deployed. Rollback restores the previous pointers and renderer/tool changes; historical guide snapshots and reading history remain available. New revision metadata is additive and can be omitted by an older API. Never represent a generated review receipt as native-speaker approval.
