# Library preference delivery — 9 September 2026

Feature: `LIB`. Status: unreleased working tree. Testing guide: [1.0.0](../../testing/v1.0.0/PRE-COMMIT.md). Source and package identities: [manifest](manifest-library-preferences-2026-09-09.json). Implementation/review: coding-assistant implementation and local validation; independent human/domain acceptance is not claimed.

## Problem and resulting behavior

The Library already reused many components, but some screens supplied fixed formatting or independently changed local layout/view state. As a result, table settings and tenant display locks could be ignored despite passing static component checks.

The corrected delivery resolves preferences through the shared host contract, applies managed presentation to shared tables, disables prohibited local controls, uses current display formatters, and gives six reference destinations their own content. The [feature guide](../../features/library-preferences.md) describes user flows and application integration.

## Scope

Affected packages include ops-ui, tokens, erp-config and erp-screens, together with localized demo catalogs, generated examples, verification scripts and browser tests. The 129 Library destinations share these renderers. No new production ERP or clinical service is included.

The documentation follow-up adds developer/agent rules, an indexed `docs/` structure, versioned testing guidance and a documentation gate. It preserves existing `desktop-clients/docs/` URLs and historical delivery statements.

## Installation and configuration

Use the existing monorepo package/workspace setup and Node 24 environment. Packages remain private where their manifests say so; public npm installation is not claimed. Existing application providers remain the host boundary.

Pass preferences, policy, availability and change callback to reusable workspaces. PageRenderer installs the presentation context for authorized pages. Third-party hosts must supply authenticated adapters and current policy values. Standalone demos retain optional host integration, but must be labeled as standalone.

## Compatibility and data

The host-policy properties are additive. Existing workspace calls can still use documented defaults; hosted applications should pass the current policy to obtain managed behavior. Table density now supports spacious. Controlled views/table padding/radius/formatting may look different because they correctly follow selected values.

No database migration, data conversion or deletion is introduced by these preference corrections. Existing API authentication, policy revision, record version and operation-identity contracts remain responsible for persistence and concurrency. These statements do not certify an arbitrary production adapter.

## Security, errors and localization

Presentation locks are enforced in UI controllers and remain backed by the existing preference API. They do not grant business permissions. The API must continue deriving scope/capabilities from trusted authentication.

No new error-code family is introduced by this delivery. Existing localized structured-failure and recovery contracts remain in use. New dedicated-page copy is registered in four language catalogs; native-speaker approval is pending. Diagnostic artifacts contain fictional fixtures and route/status information, not real patient/customer records.

## Verification and known limits

See [verification](verification-2026-09-09.md) for actual commands, overlapping counts, source chronology and retained evidence. Builds, local development-server browser checks, native runtime checks and deployed-artifact acceptance are recorded separately.

WebKit could not launch due to missing host libraries. Native Tauri execution and native-speaker acceptance were not performed for this change. Domain/API production acceptance and new remote CI/deployment are also not claimed. The existing in-app documentation backlog is not completed merely by adding repository guides.

## Upgrade and rollback

Before integration, validate the new effective presentation against application layouts, especially wide tables, wrapped values, independent fonts and managed controls. Update copied examples to pass the host contract. Test prior stored preferences and live lock/unlock changes.

Before an authorized release, retain the prior deployable artifact and current preference/database backups using the existing operational backup process. There is no new schema migration to reverse for this feature. Restore the previous reviewed artifact through the established deployment mechanism if necessary; do not delete preference/draft/audit data as a cosmetic rollback step. An older frontend may reintroduce the audited display-policy gaps even though backend policy enforcement remains.

## Publication

Commit: not created for these changes. Tag: not created. Push: not performed. Hosted CI: not newly executed. Registry publication: not performed. Deployment: not performed. Do not copy older feature deployment statuses into this record.
