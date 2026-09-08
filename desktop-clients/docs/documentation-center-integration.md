# Documentation Center: implementation and integration

## Available implementation

The shared web/desktop Documentation Center provides Page guides, Releases, Patches and What's new. It is registered in the backend menu and available from the header book icon. The page documentation drawer renders the same API content. Tours load their page/version/language steps from that content and retain the existing safe, reduced-motion-aware spotlight engine.

The current manifest covers 179 registered pages. Four initial authored workflows cover Customer Master, Patient Master, Preferences and Documentation Center, with authored English, Arabic, Hindi and Malayalam paragraphs. The other 175 entries are clearly labeled schema/tour reference guides, not completed detailed workflow manuals. Field rules reflect existing form schemas; no new business validations are introduced by documentation.

Native-language UI follows the effective preference and administrator locks. Body content uses its separate translation file, then existing product translations, then visible English fallback. Translation and healthcare-domain reviews remain pending.

## Read and change flow

1. A published notice identifies a page, section, release and revision.
2. Authorized users see an unread count on the book icon and an inline notice on the affected page.
3. Read explanation opens the exact section and saves read status.
4. Dismiss hides the inline notice but keeps it in What's new.
5. Required notices separately expose I understand. Reading or dismissing never supplies acknowledgment.

State is persisted in `dummy-api/data/documentation.sqlite`, keyed by authenticated tenant, product, user, notice and revision. Repeated operations preserve their first timestamp. Stale revisions return 409. The server ignores client-supplied tenant identity and verifies product/page access before reading content or accepting a state change.

Opening a guide directly does not mark unrelated release notices as read. Current initial notices are routine, so they intentionally do not require acknowledgment. Required-acknowledgment behavior has API regression coverage.

## Content files and versioning

- `dummy-api/config/documentation/releases.json`: immutable guide snapshots, release metadata and notices.
- `dummy-api/config/documentation/translations.json`: translations for document body paragraphs and release notices, separate from bundled UI labels.
- `dummy-api/config/documentation/availability.json`: default active release and optional product/tenant rollout overrides.
- Optional `documentation/products/<product-id>/releases.json`: product-specific manifest replacing the shared starter content.
- `erp-config/src/documentation.ts`: client types and the compiled `DOCUMENTATION_RELEASE` identifier.

Use exact release IDs, not lexical comparison of display versions. Releases are ordered oldest to newest in the manifest. Patch entries have `type: "patch"` and a valid `parentId`; ordinary releases have `type: "release"`. No fictional historical patches are seeded. The patch page displays an explicit empty state until verified patch records are authored.

The current archive includes verified shared-frontend and server-control releases, the preference-policy release and the new documentation release. The two older records explicitly indicate that historical guide snapshots were not captured. It is not yet a complete reconstruction of older project releases. Do not reuse current instructions as historical snapshots when the original content is unknown.

Each page guide contains a title, module, revision, authoring status, sections with stable IDs, field references and tour steps. Renderers accept text and structured fields, not executable HTML. Tour targets reference existing `data-tour` anchors and cannot submit business records.

Example rollout configuration:

```json
{
  "defaultReleaseId": "2026-09-08-documentation",
  "products": {
    "nexora": {
      "defaultReleaseId": "2026-09-08-documentation",
      "tenants": {"pilot-tenant": "2026-09-08-preferences"}
    }
  }
}
```

The server refuses versions beyond the active release for that tenant/product. A client always requests its compiled version or an older version selected for reading. If the client build and the tenant rollout do not match, the viewer reports unavailable content instead of showing another version's instructions. Coordinate client activation and API availability; restart the demo API after changing content/configuration, which is loaded into memory.

## API adapter

Use the existing authenticated product request adapter with `X-Product-Id` on every call. Both built-in products reuse the engine. These implementation endpoints consolidate several proposed plan endpoints:

```text
GET /documentation?releaseId=<id>&language=ml
GET /documentation?releaseId=<id>&language=ml&pageId=patient-master
GET /documentation?releaseId=<id>&language=ml&q=patient&offset=0
PUT /documentation/state
```

The index returns up to 50 matching authorized page summaries, `total`, `nextOffset`, visible releases, notices and unread count. Guide responses return the page snapshot and its language/review metadata. Search matches localized guide text and module/title. Unknown versions and missing snapshots return 404; unauthorized pages return 403; malformed parameters return 400.

State write example:

```json
{
  "releaseId": "2026-09-08-documentation",
  "changeId": "preference-policy-controls",
  "revision": 1,
  "action": "read"
}
```

Other actions are `dismiss` and `acknowledge`. Acknowledgment is accepted only for a notice explicitly configured to require it. Keep failures visible and let the user retry; do not show a successful acknowledgment before the server confirms it.

The session caches previously fetched document responses under tenant/user/role/product/request keys. A network failure can display a previously fetched guide with an offline-copy warning; authorization failures do not fall back to cache. This is in-session reading support, not complete offline application bootstrap. Read-state writes require a connection and are not silently queued.

## Adding a feature or patch

1. Identify the registered page and exact affected section.
2. Copy the previous manifest into a new release entry; update only the changed guide snapshots and their revisions. Preserve historical entries.
3. Add a notice with a unique stable ID, revision, category, page, section, release and acknowledgment requirement. Optional `roles` restrict notice eligibility.
4. Add translated body content, then obtain native/domain review as appropriate. Current content status remains pending until that review happens.
5. Validate with `npm run verify:documentation`, localization checks and relevant API/browser tests.
6. Set the new compiled documentation release and active availability for the deployment. Deploy matching client and API content.
7. Verify links, notice state and version behavior after activation. Roll back the client and availability together if needed; keep reading history.

The validator checks missing registered-page references, manifest relationships, notice links and translations for authored workflows. It intentionally reports unfinished authoring rather than calling generated references complete. It does not verify human accuracy or replace a native-speaker review.

## Remaining plan work

- Author and review detailed task instructions for the 175 reference-only pages.
- Complete native-speaker and healthcare-domain review, including field/tour wording.
- Backfill verified older releases and patch records with documented historical gaps.
- Build richer content features such as localized screenshots, cross-page article links, audience-specific sections and a contents pane for long guides.
- Add a publication/reviewer UI, publication audit records, and stronger CI rules for immutability against the base revision. File-based reviewed authoring is the current workflow.
- Complete offline native bootstrap, durable queued reading events and reconnection reconciliation.
- Add complete acknowledgment UX coverage, notification preference controls, and full browser/native release/rollback tests.
- Harden rollout/version configuration validation and introduce signed/immutable production manifests as needed by the integrating service.

The underlying demo authentication remains a demo identity service. Production integrations must supply trusted tenant membership, product/page permissions, release publication permissions and storage retention rules.

## Validation recorded for this implementation

- 1,399 unit tests passed across 83 files.
- 45 API tests passed, including documentation HTTP checks, persistence, independent acknowledgment, product isolation and tenant rollout limits.
- Documentation browser suite passed: guide navigation, release history, patch empty state, exact-section notice links, persistent read state and actual Arabic/Hindi/Malayalam article rendering with RTL checks.
- Type checking, both production builds and the complete verification suite passed. The runtime suite registry now contains 29 suites; only the new documentation browser suite was executed locally for this change.
- Deployment follow-up: application commit `0863354` passed all six remote CI jobs (31 end-to-end suites) and is deployed on both demo sites as `20260908162629872-aaba59f3`. The counts above record the initial documentation-only validation. See the [deployment report](sentinel-deployment-2026-09-08.md) for final combined validation and screenshots.
