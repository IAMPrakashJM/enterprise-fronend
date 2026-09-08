# Product starter

Both shells now consume `products/active.ts`. Product configuration belongs to the
application in `products/<id>/`, while shared shell and screen packages stay reusable.
Nexora remains the active product. Ledger is a small second example with finance
navigation, a Customers page and different action permissions for the demo roles.

## Create and select a product

Use Node 24 and install the monorepo dependencies, then run from `desktop-clients`:

```sh
npm run product:create -- --id acme-finance --name "ACME Finance" --module finance
```

This creates `product.ts`, `services.ts` and setup instructions. It validates the
slug/module, escapes the generated name, refuses to overwrite an existing folder,
and leaves the active product unchanged. Select the new product in `products/active.ts`:

```ts
export { product } from "./acme-finance/product";
export { services } from "./acme-finance/services";
```

Both apps mount `ApplicationProductProvider` inside their session provider. It
applies product branding, available pages and the signed-in role before navigation
and screens render. The old `APPLICATION_PRODUCT` export is retained for existing
consumers; these two applications now use the application-owned composition file.

## Configure branding, navigation and permissions

```ts
import { defineProduct } from "@pepbits/erp-config";
export const product = defineProduct({
  id: "acme-finance", name: "ACME", accentName: "FINANCE",
  tagline: "Finance workspace", defaultModule: "finance",
  enabledModules: ["finance"],
  enabledPages: ["customer-master"],
  pageTitles: { "customer-master": "Customers" },
  access: {
    pages: { "ai-administration": ["enterprise-admin"] },
    actions: {
      create: ["enterprise-admin", "finance-manager"],
      edit: ["enterprise-admin", "finance-manager"],
      archive: ["enterprise-admin"],
      export: ["enterprise-admin", "finance-manager"],
    },
  },
});
```

`enabledPages` is optional. When set, it limits domain pages while retaining module
dashboards and shared shell utilities. Unknown pages/titles/rule targets fail at
configuration time. Page titles update navigation labels; denied pages disappear
from nested menus and command search. Direct page/new/edit targets are checked too.
New, edit, inline edit, preview edit, archive and explicit export actions respect
the configured roles. Rules omitted from a profile allow existing demo behavior;
an empty role list denies that action to everybody. Generated starters restrict
writes/exports to enterprise-admin until the developer configures their roles.

These are frontend availability rules. Backend services must authorize every
request; the UI cannot enforce authorization or prevent browser printing/copying.
Specialized domain workflow permissions require their own adapters and rules.

Branding applies to login and signed-in shell chrome. App-store icons, native
bundle identifiers, HTML metadata, legal copy and domain-specific demo text are
still application packaging/customization tasks.

## Replace services

`ProductServices` provides these extension points:

- `request(path, init)`: worklist search/archive/inline edits, personal views,
  reference lists, export audit, and the default HTTP record adapter.
- `panels: RecordPanelsAdapter`: replace attachment, comment, related-record and
  activity persistence. See [record panels](record-panels.md).
- `records: RecordAdapter`: optionally replace the record protocol entirely while
  retaining shared versioning, draft recovery, conflict review and retry behavior.

The default uses the existing authenticated demo API. A product-owned `request`
adapter may translate paths/payloads and use its own endpoint. Preserve abort
signals, status codes and response shapes described in
[worklist-workflows.md](worklist-workflows.md) and [record-editing.md](record-editing.md).
The request hook refuses new calls captured under an ended session. Domain record
adapters must also honor session ownership; never share controllers across users.
Do not put service secrets into frontend configuration.

```ts
import { authedFetch } from "@pepbits/auth";
import type { ProductServices } from "@pepbits/erp-screens";
export const services: ProductServices = {
  request: (path, init) => authedFetch(path, init),
  // records: yourVersionedRecordAdapter,
};
```

Authentication, preferences/column-layout persistence, notifications, AI and file
services still use their existing boundaries. Use a separate origin for each
product while browser auth/preferences storage remains shared by the demo.
This starter selects existing module/page/schema types; arbitrary new domain
modules and form-schema registration remain a separate extension.

## Validate and upgrade

1. Keep product files application-owned; upgrade shared packages together in this
   monorepo rather than copying framework implementation into each product.
2. Run `npm run test:products`, `npm run typecheck` and `npm test`.
3. Run both app builds and the product's browser journeys before release.
4. Review record/worklist adapter contracts when updating shared code; preserve
   version conflicts, failed saves, session ownership and sensitive-filter handling.
5. Use isolated release preparation/activation from [deployment.md](deployment.md).

`e2e/product-starter.mjs` checks the Ledger example in an isolated desktop browser
for administrator, finance-manager and operations-analyst accounts. It covers
branding, selected pages, command access and create/edit/archive availability.
Select Ledger locally before running it, then restore the active product. The
normal record/workflow suites continue to check Nexora.


## Validated release

Release `20260908002211440-aa85e69e` was activated on 8 September 2026 with Nexora
selected. Both public hosts passed release identity and authenticated worklist/
personal-view reads with no runtime errors. The API did not require a restart.
Validation: 1,325 frontend tests across 72 files, generator regression test, all
package type checks and structural checks, isolated web/desktop builds, Ledger's
production desktop build and three-role Chromium checks, and Nexora record
recovery/create/save checks. Browser fixture writes used an isolated API.

CSV imports are replaceable through `ProductServices.imports`. The shared workflow
currently configures Customer Master; see [csv-import.md](csv-import.md) for the
adapter contract, validation and entity extension boundaries.

`ProductServices.approvals` replaces the approval transport. Customer Master ships
with submission, configured role stages, bulk decisions, history and in-app
requester notifications. See [approvals.md](approvals.md).
