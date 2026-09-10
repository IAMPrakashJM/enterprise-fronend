# Billing patient card removal deployment — 10 September 2026

Release `20260910055109901-4206ac61` is active on both demo sites. Application commit `50c72cdf792e162f4f522f5ef3498a8f7aabb307` was pushed to main. This supersedes the local-only status in the [implementation record](billing-banner-removal-2026-09-10.md), preserving its test evidence.

- https://front-design.pepbits.com/library/billing-clinic
- https://desktop.front-design.pepbits.com — Library → Page templates → Billing Clinic

`npm run deploy:prepare --prefix desktop-clients` passed isolated production builds and packaged asset checks. `npm run deploy --prefix desktop-clients -- --activate 20260910055109901-4206ac61` passed activation health checks. This frontend-only change required no API restart or data migration.

Public Chromium checks at 1600 × 1000 passed on both sites: expected release identity, authenticated patient/ledger loading, patient selector retained, patient name heading and avatar card absent, no horizontal overflow and no page JavaScript errors. No billing or clinical mutations were made. [Logs, screenshots and hashes](evidence/billing-banner-deployment/manifest.json) retain the evidence.

Previous release `20260910044334283-53f49c0a` remains available for rollback by activation. Remote CI run `34442728422` was in progress when this record was written; no remote success is claimed. Native executable checks were not run. Documentation checks passed; a documentation follow-up commit may trigger another CI run.
