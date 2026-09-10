# Own Settings: default module

Open **My Preferences → Own Settings → Default module**. The dropdown lists modules supplied by the authenticated navigation API for the current user and application, plus **Use application default**. Selecting a module uses the existing preference save flow; it does not navigate away from the settings page.

An explicit choice takes priority when opening application home or starting a new desktop session. On web, direct page URLs stay on the requested page, including Preferences after reload. Choosing the application default removes the personal selection and retains existing start-up behavior: web still honors its last-visited/current-module settings, and desktop uses the configured application module. A tenant default or lock remains effective when the personal override is removed.

## API and architecture

`UserPreferences.defaultModule` is a stable module ID; an empty string requests application/policy defaults. The existing authenticated `/preferences` endpoint stores it in SQLite, scoped by tenant, application and user, with optimistic policy/user revisions. No module preference is stored in a new browser/local persistence mechanism.

The shared Preferences page consumes `useProduct().modules`, populated through `/navigation`; it does not maintain a separate hardcoded module list. `/navigation` applies the accessible effective module preference to its default module/page and revision. The desktop workspace initializes from that API configuration. The web home redirect uses the loaded effective preference ahead of last-visited fallback, while preserving direct links. Dashboard selection falls back to an accessible module page if the normal dashboard is absent.

The server validates module membership against the authenticated user's current navigation. Unknown or inaccessible module IDs cannot be saved, including through imported settings or direct API requests. An inaccessible saved module falls back safely on read; no access is granted by setting a default. Choices remain isolated between users and products. Existing preference errors, retries, conflict handling and reset behavior are reused.

## Tenant administration and compatibility

Tenant admins can configure and lock Default module under **Preference policies → Own Settings**. The policy dropdown uses the administrator's accessible modules. Locked or unavailable preferences disable the user control and guard its change handler. The server rejects override attempts. If a policy-selected module is inaccessible to a particular user, that user's effective module falls back to the application default; the lock does not grant access.

The page reuses shared Tabs, preference sections, Select and PreferenceControl. Theme, spacing, fonts and localization remain supplied by the host. New labels/help/errors are in the canonical English, Arabic, Hindi and Malayalam catalogs; fallback catalogs are regenerated. Native-language wording review remains separate.

Versioned help and the feature alert use release `2026-09-10-own-settings`. See [test and implementation evidence](../releases/unreleased/own-settings-2026-09-10.md). This is local implementation until separately deployed.
