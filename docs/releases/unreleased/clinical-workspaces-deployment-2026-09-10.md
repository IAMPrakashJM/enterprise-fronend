# Billing and clinical workspace deployment — 10 September 2026

Release `20260910044334283-53f49c0a` is active on both demo sites. Application commit `10b1f54bf198af7a3f8e5cddcf8fd2e51144be89` was pushed to main.

- https://front-design.pepbits.com/library/billing-clinic
- https://front-design.pepbits.com/library/clinical-triage
- https://front-design.pepbits.com/library/comprehensive-consultation
- https://desktop.front-design.pepbits.com — the same pages under Library → Page templates

This delivery supersedes the local-only status in the [implementation record](clinical-workspaces-2026-09-10.md) and [feature guide](../../features/clinical-workspace-update.md), preserving their historical evidence.

## Deployment and verification

`npm run deploy:prepare --prefix desktop-clients` built both production shells from the committed source in isolation and passed packaged HTML/assets checks. `npm run deploy --prefix desktop-clients -- --activate 20260910044334283-53f49c0a` activated the release and passed both shell health checks. The API was stopped for a consistent backup and restarted with the correction command and updated catalogs/help. Existing demo sessions may require signing in again.

Public Chromium checks at 1600 × 1000 passed on both hosts: expected release identity, sign-in, authenticated billing ledger/catalog loading, triage and consultation API loading, master-record rails, all three triage and nine consultation sections, exactly one rendered clinical section at a time, no horizontal page overflow and no page JavaScript errors.

The checked live patient ledger had no invoices. Live verification therefore did not open an existing bill view/edit screen or create a financial transaction. The full view/edit correction, revision history, payment/refund, CSV/Excel and print flows passed against the isolated demo API before deployment, as recorded in the implementation evidence. No live billing or clinical mutations were made.

[Retained logs, screenshots and artifact hashes](evidence/clinical-workspaces-deployment/manifest.json) identify the live evidence. Remote CI run `34438289049` was still in progress at the time of this record; no remote success claim is made. A documentation follow-up push may start another run.

## Recovery and remaining acceptance

Previous frontend release `20260910041820340-ad612fb7` remains available through the activation command. Restricted local backup `.deploy/backups/clinical-workspaces-20260910/` contains previous API/config source and the consistent demo data archive; it is excluded from Git. API rollback is separate from shell activation. Inspect later writes before any data restoration. The unrelated services on ports 3102 and 3103 were not restarted.

Native executable acceptance, other desktop browsers, native-speaker and clinical review, production payer/payment integration and certified invoice amendment remain separate work. This deployment does not complete unrelated project-wide pending documentation workflows.
