# Unreleased frontend delivery

Record: `library-preferences-2026-09-09`. **Deployed to both demo sites.** See the [deployment follow-up](deployment-2026-09-09.md). Earlier records below retain their status at the time they were written.

| Item | Record |
| --- | --- |
| Patient Record footer and Preferences follow-up | [Preference consolidation](record-preferences-2026-09-09.md) |
| Documentation follow-up and its own validation | [Documentation delivery](documentation-2026-09-09.md) |
| Detailed change/recovery notes | [Library preference delivery](library-preferences-2026-09-09.md) |
| User and integration instructions | [Feature guide](../../features/library-preferences.md) |
| Technical flow | [Architecture](../../architecture/library-preferences.md) |
| Tested scope and limitations | [Verification](verification-2026-09-09.md) |
| Base commit, file hashes and actual package versions | [Manifest](manifest-library-preferences-2026-09-09.json) |
| Retained results and hashes | [Evidence index](evidence/results.json) |
| Browser route observations | [Browser cases](evidence/browser-routes.csv) |
| Applicable testing-document contract | [Guide 1.0.0](../../testing/v1.0.0/PRE-COMMIT.md) |

The source baseline is `82656eeedf809c8419bd6e2ae4674580cb3ff71a` plus the recorded working-tree implementation. The manifest explains its digest scope and excluded documentation/configuration files. It identifies delivery contents; earlier test runs are not retroactively assigned that final tree identity.

Publication fields remain null/false until the corresponding action actually succeeds. New remote CI and built-artifact acceptance are still future release work. The documentation task changes no application runtime behavior and does not deploy this delivery.
