# Registry design family — 9 September 2026

Adds five Library templates for worklists, small masters, billing, claims and clinical consultation. The set reuses the approved patient section layout and shared template engines, with display preferences controlled centrally. Existing template routes retain their original renderer.

The demo API menu and four language catalogs include the new group. Library coverage expands from 129 to 134 destinations and the template collection from 97 to 102. Historical audit/browser evidence retains its original scope; the current inventory includes the five additions.

See the [user and integration guide](../../features/registry-design-family.md). This is a frontend template delivery with an in-memory business-data adapter; production financial and clinical integrations are outside its completion boundary.

Validation: 15 targeted tests across the shared template engine, all-template preference coverage and Registry family passed. API navigation tests (3) and documentation-store tests (4) passed. Chromium rendered all five pages with no page JavaScript errors; screenshots are in the feature guide. Typechecking passed after correcting a test matcher value type, and both production builds and the complete verification gates passed. New in-app guides and feature notices are published in a separate documentation version; older documentation snapshots are preserved. Native execution and native-speaker review were not performed. Initial implementation was local. The deployment follow-up below records subsequent publication.

Source base: `b681d3c153386d77819b679181458a36a3111b63` plus this working tree.

Principal source SHA-256 values:

```text
1ab6ec44bf8cd4f7bdecc73084ea6c50bab4a5f115e04009ade85a60a7a2485f  desktop-clients/packages/erp-config/src/page-templates.ts
78eb1da5bdc37b36404f7a9e2698f4ec91112d666f080590aa4eea4504ceee24  desktop-clients/packages/erp-screens/src/templates/registry-template.tsx
4b04c818b69b42743affeff9e8acdcdfb1d3532014adee52b9124d0552990179  desktop-clients/packages/erp-screens/src/templates/registry-template.module.css
0ee5691e76e036d30b0b106ba7527838770ac0ea17ded550b1b46c5fc62c75ee  desktop-clients/packages/erp-screens/src/templates/page-template.tsx
```

## Verified deployment

Application commit `647a243` was pushed to main. Release `20260909154128708-9e6b266e` is active on both https://front-design.pepbits.com and https://desktop.front-design.pepbits.com.

The isolated production build and packaged HTML/assets checks passed before activation. Live Chromium checks passed all five pages on each host, including a single shared Save action, no local layout selector, matching release identity, and no page JavaScript errors. Public authenticated API checks verified all five navigation entries and authored guides in four languages. One rapid repeated login received HTTP 429; a later retry passed without changing rate limits.

The API was restarted to load the new navigation, catalogs and documentation version. Existing sessions must sign in again. Its data backup is retained locally with restricted permissions at `.deploy/api-backups/20260909154128708-9e6b266e/data.tar.gz`. The previous frontend release `20260909152041761-ecda5200` remains available for rollback.

Remote CI was still in progress when this record was written; no complete remote CI, native executable or native-speaker acceptance is claimed. Documentation-only follow-up commits do not change the deployed application bundle.

## Sidebar label follow-up

Renamed the Library group “Clinical page templates” to “Page templates” in English, Arabic, Hindi and Malayalam. Existing navigation IDs, routes and localization keys stay stable. Generated offline catalogs use the same wording. This label-only follow-up is local and not included in the deployment recorded above.

The same local label follow-up renames Patient Query to Worklist Query, Patient Record to Master Record - Main, and Patient 360 to 360 Data in all four languages. Sidebar entries, tab titles and other consumers share the existing message keys. Existing URLs and patient-demo behavior stay compatible.

## Verified label deployment

The label follow-up is now deployed. Application commit `4ca4817` was pushed to main; release `20260909161011864-64158fe3` is active on both demo hosts. Isolated builds and packaged HTML/asset checks passed. Live Chromium checks verified Page templates, Worklist Query, Master Record - Main and 360 Data on both hosts with no page JavaScript errors. Existing URLs remain unchanged.

The demo API restarted to load translations, so existing sessions must sign in again. A restricted data backup is retained at `.deploy/api-backups/20260909161011864-64158fe3/data.tar.gz`. Previous frontend release `20260909154128708-9e6b266e` remains available for rollback. Remote CI was still running when recorded; the browser checks verified English labels, not native-speaker approval.
