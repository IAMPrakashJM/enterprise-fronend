# Tenant preference policies

Implemented September 8, 2026.

## What users can do

A tenant administrator can set a default value and lock or unlock each of the 53 stored preferences. Policies apply to one tenant and one application. A policy for Nexora does not change Ledger or another tenant.

1. Sign in with an account granted `preferences:manage` by the backend.
2. Open **Preferences → Preference policies**.
3. Browse the Behaviour, Shell, Page, Notification, Language & help, and General groups, or search by setting or group name. Choose a value and switch **Locked** on to require it.
4. Select **Save policy**. The policy history records the revision, administrator ID, and time.
5. Switch **Locked** off and save to allow personal choices again. **Use application default** removes that setting's rule; save to apply the removal.

For example, an administrator can require Arabic and the Midnight theme while allowing each person to choose their table page size. Locked settings show “Managed by your administrator” and cannot be edited in personal Preferences. Shared controls also check the policy. Imports and resets cannot replace locked values, and the API rejects direct attempts.

An unlocked administrator value is a default: an existing personal choice takes precedence. A locked value takes precedence over personal choices. The saved personal choice is retained under a lock and restored when the administrator unlocks the setting. A reset uses the current administrator defaults for editable settings.

The policy also applies to the administrator's personal preferences. Their policy editor remains available so they can unlock settings.

## How changes reach users

Preferences and their policy load at sign-in, including the selected language before the page renders. Open sessions refresh on window focus and every 60 seconds when visible and without a pending personal save. Saving a policy refreshes that browser immediately. A stale personal save is rejected and reloads the latest settings. While the initial policy cannot be loaded, preference changes remain disabled.

This is polling, not a real-time push channel. An inactive tab may show its previous appearance until refreshed. Backend write enforcement is immediate. Preferences control application presentation; they are not a replacement for permissions on business operations.

## Architecture and storage

- `erp-config/src/preference-policy.ts` validates rules and calculates defaults, effective settings, and editable overrides.
- `erp-shell/src/erp-context.tsx` loads policies, guards shared setters, serializes personal saves, and handles revisions and language loading.
- `erp-screens/src/preferences/policy-controls.tsx` disables managed controls. `policy-admin.tsx` provides the administrator editor.
- `dummy-api/preference-store.mjs` enforces permissions and values, and stores policies, personal overrides, and policy history in `dummy-api/data/preferences.sqlite`.
- `dummy-api/server.mjs` derives the tenant and user from the authenticated session and checks application access before calling the store.

Resolution order is **application defaults → tenant/application defaults → personal overrides → locked values**.

SQLite uses WAL transactions and persists history with the policy update. The policy-history endpoint returns the latest 20 revisions; the database retains earlier revisions. Policy updates also emit audit events. Back up SQLite using an online backup mechanism or stop the API before copying its data directory; do not copy only a live database while ignoring its WAL.

Legacy `preferences.json` values are used for known Nexora accounts until a scoped personal record is saved. Other products and tenant identities do not inherit those legacy values.

## Integrating another application

Register an application using the existing product profile and navigation-access contract. Pass its request adapter as the product provider's `preferenceRequest` (the standard product bootstrap already does this). Both the user-preference and policy-admin requests must target the same backend and authenticated session.

Send `X-Product-Id: <registered-product-id>` on each request. Allow this header in CORS when the API has a different origin. The demo API defaults missing product IDs to `nexora` for compatibility; new integrations should always send the header.

The production backend must derive tenant membership and `preferences:manage` from trusted authentication. Never accept a tenant ID or administrator permission from a preference request body. The included demo account `USR-00301` has the explicit permission; this is a demo grant, not a production identity integration.

### API contract

`GET /preferences` returns:

```json
{
  "preferences": { "language": "ar", "theme": "midnight" },
  "overrides": { "theme": "sand" },
  "policy": { "revision": 3, "rules": {
    "language": { "value": "ar", "locked": true },
    "theme": { "value": "midnight", "locked": true }
  } },
  "userRevision": 7,
  "canManage": false
}
```

The `preferences` object above is abbreviated; actual responses contain all preference fields. `overrides` may include dormant personal choices beneath locks.

`PUT /preferences` replaces the editable personal overrides, preserving dormant locked choices:

```json
{ "preferences": { "pageSize": 50 }, "policyRevision": 3, "userRevision": 7 }
```

Omit locked fields entirely. Omit an editable field to use its current default. Use `editablePreferenceOverrides` to prepare the payload in shared frontend integrations. Include both returned revisions. The demo accepts a missing policy revision only before any policy exists and permits a missing user revision for legacy clients.

`GET /preference-policy` requires administrator permission and returns `{ policy, canManage, history }`.

`PUT /preference-policy` also requires administrator permission. It replaces the complete rule set and expects the current policy revision:

```json
{ "revision": 3, "rules": {
  "language": { "value": "ar", "locked": true },
  "theme": { "value": "midnight", "locked": false }
} }
```

The response contains the saved policy with revision 4. Keep rules that should remain; leaving a rule out removes it. Invalid fields or values return 400, unauthorized or locked writes return 403, and stale revisions return 409. Reload and review a conflict before saving again.

## Validation and remaining boundaries

Automated coverage includes store and HTTP permission enforcement, tenant/product/user isolation, persistence, invalid values, revision conflicts, dormant-choice restoration, shared state behavior, and a browser flow through the administrator editor, imports, resets, and language enforcement.

Local validation: 1,399 unit tests and 40 API tests passed; the preference-policy browser suite passed. Type checking, both production builds, and the repository verification suite passed. All jobs in [remote CI run 34231858793](https://github.com/IAMPrakashJM/enterprise-fronend/actions/runs/34231858793) passed, including all 28 registered browser/native suites. Application commit `6e7ad75` was deployed as release `20260908132518280-e399b58e` on both demo sites. Public HTTP checks verified health, login, navigation, catalogs and policy permissions; browser checks verified all 53 settings in both administrator editors without runtime errors. The initial desktop browser login check timed out; a fresh isolated rerun passed. No live tenant policies were changed during these checks.

The editor has English, Arabic, Hindi, and Malayalam copy. Native-speaker sign-off remains a separate review task. Production identity provisioning, distributed storage, and any push-notification transport must be supplied by the integrating application. Role-specific policies and limiting users to a subset of allowed values are not implemented; this version supports tenant/application defaults and locks.
