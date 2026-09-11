# Authored-guide translation and Jira review — 11 September 2026

## Documentation completed

Reviewed the four authored guides identified by the [reference-guide audit](../../documentation/reference-guide-audit-2026-09-11.md): Customer Master, Patient Master, Preferences and Documentation Center. Added Arabic, Hindi and Malayalam translations for 17 distinct missing field/tour phrases in canonical shared catalogs and documentation translation mappings. Generated frontend fallbacks were synchronized.

This closes all 12 incomplete page/language entries on those authored guides. All 147 authored guides now have complete catalog coverage in these three languages. No native-speaker approval is asserted. The English source text and historical guide snapshots were not changed; existing workflow claims still have the limits recorded by the audit.

The same phrases are reused by reference guides. Translation hashes were refreshed for 507 affected page/language entries, leaving review evidence empty. Completeness is calculated from actual text; the remaining reference translations were not marked complete. Current backlog: 168 guide-authoring issues, 504 incomplete translation entries and 441 current translations awaiting native review. Total: 1,113 entries. See the [generated backlog](../../documentation/backlog.json).

## Independent Jira connection task

Inspected the local Jira configuration under `/home/pepadmin/.config/pb` without copying its secrets into repository files or tool output. The configuration points to `https://pepbits.atlassian.net`, project `PLIBRYUI`, and supplies account email/API-token authentication. The credential file is readable only by its owner (`0600`).

Read-only connection tests reached Atlassian tenant discovery, but authenticated current-user requests returned HTTP 401 through both the site API and cloud gateway. Project visibility could not be established while authentication failed. No Jira issues or other remote records were created, edited or commented on.

To retry, the configuration owner must replace the local account email/token pair with valid credentials that have Jira access. Do not put tokens in documentation, Git, issue descriptions or chat. An expired, revoked or mismatched credential is possible; this test does not determine the exact cause. This task result is a connection failure, not a successful Jira integration.

## Verification and delivery boundary

Source base: `3403857`; this follow-up changes documentation translations, generated fallbacks, translation revisions, impact receipts, backlog and current status documentation. It does not change guide source snapshots or application workflow logic. Catalog/lifecycle checks and the documentation API tests are recorded in the [validation log](evidence/documentation-translation-review-2026-09-11.log).

These updates are not deployed by this task. The latest recorded demo deployment remains `20260910173632033-48931d24`. Completing all inherited page guides and obtaining native/domain review are still separate work; this record does not claim those tasks finished.
