# Own Settings deployment — 10 September 2026

Release `20260910041820340-ad612fb7` is active on both demo sites. Application commit `536b4be24646700c7bb8d182f081e17b30ca1121` was pushed to main.

- https://front-design.pepbits.com/library/preferences — Own Settings → Default module
- https://desktop.front-design.pepbits.com — My Preferences → Own Settings → Default module

This delivery supersedes the local-only status in the [implementation record](own-settings-2026-09-10.md) and [feature guide](../../features/own-settings.md). Their original test evidence is preserved.

## Verification

`npm run deploy:prepare --prefix desktop-clients` built both shells from the committed source in isolation and passed packaged HTML/assets checks. `npm run deploy --prefix desktop-clients -- --activate 20260910041820340-ad612fb7` activated the release and passed both shell health checks. The demo API was backed up while stopped, then restarted with the new module preference validation and personalized navigation.

Public Chromium checks at 1600 × 1000 passed on both hosts: expected release identity, authenticated sign-in, Own Settings tab, Default module control, dropdown module IDs exactly matching authenticated navigation API module IDs, no horizontal page overflow and no page JavaScript errors. The verification script uses the public `/api` prefix. These checks did not change live preferences or tenant policies. Persistence, startup selection and lock enforcement were tested with the isolated API as recorded in the implementation evidence.

[Deployment logs, live screenshots and hashes](evidence/own-settings-deployment/manifest.json) retain the evidence. Remote CI run `34436666861` was in progress at the time of this record; no remote success claim is made. The documentation follow-up push may trigger another run.

## Recovery and boundaries

Previous frontend release `20260910023723076-286aac07` remains available for activation. Restricted local backup `.deploy/backups/own-settings-20260910/` contains previous API/config source and a consistent demo data archive; it is excluded from Git. API rollback is separate from shell activation. Review subsequent writes before restoring data. API restart invalidates existing demo sessions, which can sign in again.

Native executable testing, other desktop browsers and native-speaker wording review are not established by this deployment. Existing project-wide pending documentation workflows and external integrations remain unchanged.
