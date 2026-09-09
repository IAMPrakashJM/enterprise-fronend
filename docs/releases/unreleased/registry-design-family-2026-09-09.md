# Registry design family — 9 September 2026

Adds five Library templates for worklists, small masters, billing, claims and clinical consultation. The set reuses the approved patient section layout and shared template engines, with display preferences controlled centrally. Existing template routes retain their original renderer.

The demo API menu and four language catalogs include the new group. Library coverage expands from 129 to 134 destinations and the template collection from 97 to 102. Historical audit/browser evidence retains its original scope; the current inventory includes the five additions.

See the [user and integration guide](../../features/registry-design-family.md). This is a frontend template delivery with an in-memory business-data adapter; production financial and clinical integrations are outside its completion boundary.

Validation: 15 targeted tests across the shared template engine, all-template preference coverage and Registry family passed. API navigation tests (3) and documentation-store tests (4) passed. Chromium rendered all five pages with no page JavaScript errors; screenshots are in the feature guide. Typechecking passed after correcting a test matcher value type, and both production builds and the complete verification gates passed. New in-app guides and feature notices are published in a separate documentation version; older documentation snapshots are preserved. Native execution and native-speaker review were not performed. Status: local implementation; not published or deployed as part of this task.

Source base: `b681d3c153386d77819b679181458a36a3111b63` plus this working tree.

Principal source SHA-256 values:

```text
1ab6ec44bf8cd4f7bdecc73084ea6c50bab4a5f115e04009ade85a60a7a2485f  desktop-clients/packages/erp-config/src/page-templates.ts
78eb1da5bdc37b36404f7a9e2698f4ec91112d666f080590aa4eea4504ceee24  desktop-clients/packages/erp-screens/src/templates/registry-template.tsx
4b04c818b69b42743affeff9e8acdcdfb1d3532014adee52b9124d0552990179  desktop-clients/packages/erp-screens/src/templates/registry-template.module.css
0ee5691e76e036d30b0b106ba7527838770ac0ea17ded550b1b46c5fc62c75ee  desktop-clients/packages/erp-screens/src/templates/page-template.tsx
```
