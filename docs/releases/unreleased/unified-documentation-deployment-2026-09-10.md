# Shared documentation and billing rail deployment — 10 September 2026

Runtime commit `bdc45fe357cb9691f2d80fb0377838e70750aeb1` was pushed and deployed as `20260910102230415-e7419c6c` on both [web](https://front-design.pepbits.com/library/list-of-pages) and [desktop browser](https://desktop.front-design.pepbits.com/library/list-of-pages) demos. This supersedes the local-only publication status in the [implementation record](unified-documentation-2026-09-10.md) and [billing alignment record](billing-rail-alignment-2026-09-10.md).

## Delivered behavior

Page Help, catalog guides, the documentation drawer and Documentation Center share API articles and release/language selection. Translation revision metadata and source-impact checks are included. The API restarted with documentation release `2026-09-10-unified-help`. Billing uses a top-aligned, wrapping rail, one active section and aligned footer actions; existing effective layout preferences remain supported.

## Verification

Production preparation rebuilt both shells and passed isolated packaged HTML/asset checks. Activation health checks passed. Public Chromium acceptance at 1700 × 1050 passed on both hosts: runtime release identity, matching catalog/contextual Help article, Arabic/Hindi/Malayalam API content and explicit pending review status, plus PT-0003 billing rail containment, grouped items, one selected orders section and a footer within the viewport. No live record, preference or reading-state mutations were requested. Native-language UI screenshots and workflow writes were tested earlier against an isolated API, not repeated live.

The first [CI run 34465721948](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34465721948) failed TypeScript because the new catalog unit test used an unsupported `exact` option with Testing Library. The option was removed; exact string role names already match by default. This is a test-only correction and does not change the deployed runtime. Final local catalog tests and type checking are retained below; the pushed follow-up triggers a fresh CI run whose outcome is not claimed here.

**Correction to earlier local evidence:** the prior implementation record overstated final TypeScript acceptance for the added missing-code test. CI exposed that final test-source error. Earlier logs remain historical; use this follow-up's typecheck and test results for the correction.

Evidence: [manifest](evidence/unified-documentation-deployment/manifest.json), [prepare](evidence/unified-documentation-deployment/prepare.txt), [activation](evidence/unified-documentation-deployment/activate.txt), [live checks](evidence/unified-documentation-deployment/live.txt), [CI failure](evidence/unified-documentation-deployment/ci.txt), [corrected catalog tests](evidence/unified-documentation-deployment/testfix.txt), [final typecheck](evidence/unified-documentation-deployment/typecheck.txt), [web guide](evidence/unified-documentation-deployment/web-guide.png), [desktop guide](evidence/unified-documentation-deployment/desktop-guide.png), [web billing](evidence/unified-documentation-deployment/web-billing.png), [desktop billing](evidence/unified-documentation-deployment/desktop-billing.png).

## Completion limits and recovery

This is a demo deployment of the documentation infrastructure. The 168 reference-only guides, incomplete translations and native-review backlog remain pending. Strict authored/native-reviewed release acceptance still fails intentionally. No native executable acceptance, protected-branch configuration or human approval is claimed.

Prior frontend release `20260910075313100-3c6ad150` is retained. With Node 24, use `npm run deploy --prefix desktop-clients -- --activate 20260910075313100-3c6ad150` to roll back both shells. Older clients continue to request the retained prior guide snapshot. For a full API rollback, restore documentation code/configuration from `2696b1b` and restart the API; do not reset existing reading-state or business-data files. No billing-data migration occurred. Revision metadata is additive. No package publication or release tag is claimed.
