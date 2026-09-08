# Generic documentation, releases and change alerts — implementation plan

Date: 8 September 2026. Status: proposed implementation; the capabilities below are not completed unless explicitly described as existing.

## 1. Outcome

Provide one reusable documentation engine for ERP, Healthcare and future products. Each application receives its own page guides, guided tours, release history and patch notes. Users read everything in their effective preferred language and can open an explanation directly from a change alert.

Add a dedicated **Documentation Center** page to backend-driven navigation. Keep the page-level documentation drawer for quick help. Both render the same versioned content, so instructions do not drift between surfaces.

Do not invent documentation for historical releases. Import verified release records and identify any historical coverage gaps. Technical deployment IDs are recorded for traceability but do not replace readable product versions.

## 2. Current architecture and gaps

Existing building blocks:

- Product definitions provide stable product IDs, page registries and role-filtered navigation.
- The shared shell provides a documentation drawer, help assistant and tours using `data-tour` anchors.
- Preferences provide language, documentation visibility, help visibility, panel position and reduced motion. Tenant administrators can enforce these preferences.
- Localization catalogs and API transport already support English, Arabic, Hindi and Malayalam.
- Shared screen/UI packages are used by the web and desktop shells. Product request adapters support copied applications.

Current gaps:

- The documentation drawer mainly shows generic architecture text instead of dedicated task instructions.
- Tours are not a complete, reviewed guide for every page and workflow.
- There is no complete versioned documentation contract, release/patch archive, or durable per-user change-reading state.
- Existing deployment notes are engineering records; they are not a user-facing localized release library.

Implementation should reuse these contracts rather than introduce a second navigation, identity or language system. Confirm notification storage capabilities before deciding whether to extend it or add a dedicated change-reading store.

## 3. User experience

### Documentation Center

Use a desktop layout with a navigation pane, main reading area and article contents pane. Provide these destinations:

| Destination | Contents |
| --- | --- |
| Overview | Installed version, latest applicable release, unread changes and common guides |
| Page guides | Application/module/page hierarchy with dedicated instructions |
| Releases | Chronological product-version history, filters and release details |
| Patches | Patch history, affected versions, fixes and installation relevance |
| What's new | Relevant changes with unread/read/acknowledged state |
| Search | Authorized guides, releases, patches and change notices |

Filters: module, page, version, release type, change type and read state where relevant. Search and filters should retain state when a reader follows a result and returns.

Every release detail contains a summary, version, release date, affected modules/pages, new features, improvements, validation changes, fixes, removals, breaking changes, known issues and links to the applicable guides. Empty sections are omitted. A contents pane links to sections.

Every patch detail identifies its parent release, applicable version range, fixes, user-visible impact, known issues and superseding patch when applicable. Operator-only installation, migration and rollback instructions are separate authorized sections; ordinary users see actions relevant to them.

### Page-level help

Every supported business page exposes Documentation and Start tour through the shared page-action area or help entry. Opening documentation selects that product, page, installed version and effective language. A direct link can also select a field, validation or workflow section.

Each page guide includes purpose, eligible roles, prerequisites, field explanations, required values, step-by-step tasks, validation examples, troubleshooting, workflow transitions, related pages and guided-tour links. Use synthetic examples; screenshots must not expose patient or customer data.

### Change discovery

A newly applicable change increments a quiet documentation badge and appears in What's new. The affected page shows a dismissible inline notice on the user's next visit. Avoid a modal or toast for every patch.

Example: a new future-date validation on Patient Registration opens the precise validation explanation and optionally highlights the date field. A removed action links to its replacement or migration guide, rather than a tour anchor that no longer exists.

Opening a notice records **read** for that notice revision. Explicitly selecting **I understand** records **acknowledged** only for changes configured to require it. Dismissed means hidden from the inline position; it does not imply understanding and does not delete history. Bulk mark-as-read never supplies acknowledgment.

Default first-login behavior: show the current release introduction plus applicable unresolved required notices; older routine releases remain searchable without flooding the badge. Existing users receive newly applicable notices since their recorded documentation baseline. Language switching does not reset read state.

## 4. Identity, versions and data model

Content identity is product + document ID + immutable revision + language. Page guides also reference stable page IDs. User state additionally includes the authenticated tenant and user; it must not be shared across tenants or products.

| Record | Essential fields |
| --- | --- |
| Product release | Product ID, release ID, display version, release kind, parent release ID, publication date, availability, lifecycle status, build/deployment references |
| Guide revision | Document ID, product ID, page ID, revision, stable section IDs, audience, structured sections, tour reference |
| Release manifest | Release ID, exact guide revisions, notice revisions, tour revisions and asset references |
| Translation | Content ID/revision, language, source revision, review status, translated content |
| Change notice | Stable change ID, revision, release ID, page/section links, category, importance, audience, feature eligibility, acknowledgment requirement |
| Tour | Tour ID/revision, compatible release, steps, stable target anchors, safe reveal actions |
| User change state | Tenant, product, user, change ID/revision, delivered/read/dismissed/acknowledged timestamps |
| Publication event | Actor, action, content/release revision, timestamp, review references |

Separate product versions from document revisions: a typo correction creates a document revision without pretending the application shipped a new feature. A materially revised notice receives a new revision and an explicit decision on whether to alert again. Routine translation corrections do not reset acknowledgment; a substantive changed instruction may require a new notice revision.

Use explicit release relationships and a defined version parser if product versions use semantic versioning; never sort version strings lexicographically. Permit existing product version formats through a normalized release sequence. Each copied product has its own version history.

Published release manifests remain immutable. Corrections produce traceable superseding content; the historical manifest can still be read. An installed older native desktop build resolves its own manifest, not the latest web application's instructions.

## 5. Native-language behavior

Initial languages: English, Arabic, Hindi and Malayalam. Follow the effective preference from the existing ERP context, including tenant-admin locks. No separate documentation language preference is required.

- Localize navigation labels, body content, examples, notices, search states and tour steps.
- Keep record IDs and section anchors stable across languages; translate display text only.
- Arabic uses RTL while code, URLs and version identifiers remain readable in LTR containers.
- Locale-aware dates and numbers use shared formatters. Search handles Unicode normalization and indexes each language separately.
- Resolve content by exact installed-release manifest first, then selected language. Fall back to reviewed English from the **same content revision** with a visible notice; never silently use a different release's article.
- Record source revision on every translation. A changed source marks older translations stale and returns their status to the reader/editor.
- Keep draft, translated and native-reviewed statuses distinct. Sensitive healthcare workflows additionally require a domain-owner review.
- Critical notices require reviewed translations for the rollout's supported languages before publishing. Routine untranslated content may use an explicit English fallback under a documented publication rule.

Tour animation respects reduced motion. Translated screenshots use language-specific assets when necessary; translated captions alone must not imply that embedded English labels are localized.

## 6. Shared implementation architecture

Suggested ownership, subject to the existing package boundaries:

- `erp-config`: documentation/release schemas, stable IDs, manifest validators and product registration contract.
- `erp-data`: documentation service interface, request adapter and cache keys.
- `erp-screens`: Documentation Center, release detail, patch detail and search results.
- `erp-shell`: page entry points, unread badge, documentation context and existing tour integration.
- `ops-ui`: reusable article sections, callouts, contents navigation and release presentation components.
- `dummy-api`: validated content reader, permission checks, revision-aware APIs and durable reading/publication state.

Render structured content through allowlisted shared components. Do not accept executable HTML, scripts or arbitrary navigation actions from documents. Tour steps may request known safe UI actions such as revealing a tab; never automatically submit a record or perform a business mutation.

Begin with version-controlled JSON content and immutable release manifests. Store mutable user state in SQLite behind a repository interface. A production service can replace these adapters with a CMS/database without changing the renderer or API shape. Do not place documentation payloads in the eagerly loaded UI translation bundle.

Example content layout:

```text
config/documentation/<product-id>/
  guides/<document-id>/<revision>/<language>.json
  tours/<tour-id>/<revision>/<language>.json
  releases/<release-id>/manifest.json
  releases/<release-id>/<language>.json
  changes/<change-id>/<revision>/<language>.json
  assets/<content-hash>.<extension>
```

Register Documentation Center through the existing backend navigation configuration and product page registry. Product integrations supply their content, release resolver, service adapter and tour anchors; they reuse the same screens.

## 7. Proposed API contract

Use the established authenticated transport and `X-Product-Id` header. The server derives tenant/user identity and checks product, page, role and content visibility on every endpoint, including search and unread counts.

| Endpoint | Purpose |
| --- | --- |
| `GET /documentation/context` | Installed/applicable release, language support, content baseline and unread count |
| `GET /documentation/pages/:pageId?releaseId=...&language=...` | Dedicated page guide with fallback/review metadata |
| `GET /documentation/releases?...` | Cursor-paginated release/patch archive and filters |
| `GET /documentation/releases/:releaseId?language=...` | Release detail and its exact manifest |
| `GET /documentation/search?q=...&language=...&releaseId=...` | Permission-filtered, paginated results with section links |
| `GET /documentation/changes?...` | Applicable notices, optionally filtered by page and read state |
| `PUT /documentation/change-state/:changeId` | Idempotent read/dismiss/acknowledge operation for an exact revision |
| `GET /documentation/tours/:tourId?releaseId=...&language=...` | Compatible localized tour |

Read-state writes include operation ID and expected notice revision. Reject stale acknowledgment of a replaced notice with a reload response. Search results must not leak hidden pages, restricted snippets or unreleased feature names.

Responses include requested/resolved language, content revision, release ID and review status. Use ETags for content freshness, and scope private caches by authenticated tenant/user/product/audience. Clear private caches on sign-out and tenant changes.

For native desktop offline reading, cache only previously authorized content for the installed release. Show last-updated/offline status. Queue read events with idempotency keys; acknowledgments remain pending until server confirmation. Offline uncached pages receive a clear unavailable message.

## 8. Publication and deployment flow

1. Developer identifies affected pages and change categories in the feature PR.
2. Author updates dedicated guide sections and adds notices/tour changes.
3. Product owner reviews workflow accuracy; translator and native reviewer complete their applicable reviews. Healthcare domain owners review affected healthcare instructions.
4. CI validates schemas, coverage, links, anchors, translations and release-manifest references.
5. Build emits an application release ID. Deployment selects a matching published documentation manifest.
6. Make notices eligible only when the feature is actually active for that tenant/version/role. Publication date alone is not sufficient when rollouts are staged.
7. Clients refresh counts on navigation/focus and periodic visible-session polling; a future push channel can replace polling without changing records.
8. Rollback selects the previous manifest and suppresses notices for unavailable features. Preserve reading/audit history; optionally publish a rollback notice explaining user-visible effects.

Do not publish or alert directly from raw commits. Not every commit is a user-facing release, and commit messages are not reviewed user guidance. Security patch notices should explain safe user actions without publishing exploit instructions or restricted incident information.

## 9. Permissions and preferences

Use explicit backend permissions for documentation authoring, review and publication. Tenant administrators can manage permitted announcement preferences and targeting within their tenant; they cannot rewrite the vendor's immutable product release history.

Routine badges and inline announcements may follow user preferences if the tenant permits overrides. Required operational notices must remain reachable through notifications/What's new even when a user hides optional contextual help; define this separately from documentation visibility. Acknowledgment is evidence of an explicit action, not proof of comprehension or regulatory compliance.

Retain read and acknowledgment records according to the integrating product's declared retention policy. Validate timestamp, actor and tenant on the server. Avoid patient or record identifiers in reading events and analytics.

## 10. Delivery phases and completion gates

| Phase | Work | Completion gate |
| --- | --- | --- |
| 1 — Inventory and contracts | List registered pages, roles, supported products, existing tours, historical releases and content owners; define schemas and release identity | Every page has a documentation ID and assigned content status; no invented historical coverage |
| 2 — Content service | File-backed loader, manifest resolution, SQLite user state, access checks and API adapter | Isolation, revisions, fallback and idempotent writes pass API tests |
| 3 — Generic viewer | Documentation Center, page drawer, localized search, release/patch details and deep links | A guide renders from the same content in both surfaces and copied product |
| 4 — Change alerts | Unread counts, page notices, exact-section links, dismiss/read/acknowledge and eligibility | Repeated visits and multiple devices do not duplicate alerts or acknowledgment |
| 5 — Tours and language | Connect existing tour engine, safe reveal actions, RTL, translated content and motion controls | Representative ERP and Healthcare workflows pass in all four languages |
| 6 — Full content coverage | Dedicated guides for every supported page, verified release backfill, patch relationships and reviews | Coverage report has no unexplained gaps; required review gates are met |
| 7 — Release integration | Manifest publication, staged rollout, rollback, native installed-version resolution and offline cache | Deployment and rollback show the correct guides and notices |
| 8 — Validation and rollout | Browser/native checks, accessibility, performance, integration guide and controlled release | Agreed acceptance criteria pass and live checks confirm the released version |

First vertical slice: one ERP workflow and one Healthcare workflow with their page guide, four language variants, one patch notice and one tour each. Choose actual registered pages during inventory rather than adding fictional product IDs. This proves reuse before producing all-page content.

Full-content authoring and native/domain reviews are separate work from implementing the engine. Estimate dates after counting pages and assigning reviewers; do not equate an empty template with a completed guide.

## 11. Validation and acceptance criteria

- Every supported registered page resolves to dedicated content or an explicitly recorded rollout gap; product completion requires all such gaps closed.
- Each release/patch has a valid immutable manifest, parent relationships where needed, accurate dates and working guide links.
- A new validation notice opens the correct section for the installed version and selected language.
- A removed control never launches a tour against a nonexistent target; missing optional targets are skipped with an explanation and required targets fail content validation.
- Read and acknowledgment remain separate, persist across sessions/devices and are isolated by tenant/product/user.
- Hidden-role content is absent from direct responses, search results, counts and cache reuse.
- Arabic layout, Hindi/Malayalam text, long titles, keyboard navigation, focus return and reduced motion work in both shells.
- Older native versions never receive incompatible guides or alerts. Rollback and staged rollout preserve this guarantee.
- Test offline, stale translations, unavailable API, concurrent reading, deleted page redirects, invalid manifests and failed content loads.
- Existing page workflows, user preferences and admin locks remain functional.
- Documentation loads lazily and search is paginated; final performance budgets are recorded against the baseline during the first slice.

## 12. Deliverables and scope boundaries

Deliver the shared engine, API/storage adapters, Documentation Center, dedicated guides, release/patch archive, localized change alerts, tours, content-validation tooling, reviewer workflow and an integration guide for a new product.

Initial implementation excludes a rich visual CMS editor, machine-generated auto-publication, email/SMS delivery and automatic source-code-to-documentation claims. File-based reviewed authoring is sufficient for the first release; the service contract preserves a later CMS path.

Native-speaker and healthcare-domain sign-off require qualified reviewers. This plan does not claim those reviews, historical reconstruction, full-page content or any new runtime functionality have been completed.
