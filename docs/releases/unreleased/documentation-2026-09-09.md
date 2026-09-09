# Documentation structure and rules — 9 September 2026

Status: local documentation/CI configuration change; uncommitted and unpublished. This follow-up does not change application runtime behavior.

## Scope

Added the root documentation index, feature catalog, detailed Library user/integration guide and screenshot, architecture diagrams, developer/agent rules, release/versioning policy, feature/release/evidence templates, versioned testing guide, route inventory and retained delivery evidence. Existing frontend guides and PDF paths were preserved.

The structure was reviewed against the Pepbits framework documentation at source `769a4c0e267f15653ef0994bd8df7da2ef14fc42`. Frontend package versions and delivery states remain independent; no Maven snapshot identity was copied into this repository.

The documentation checker validates relative destinations/headings, the current guide, registered Library inventory, release-state/source fields and retained evidence hashes. Its CI step runs after dependency installation in the existing check job. Root AGENTS.md links the development/testing rules for future work.

## Local validation

| Check | Result |
| --- | --- |
| `node docs/tools/check-docs.mjs` | Passed |
| `node --test docs/tools/check-docs.test.mjs` | Passed: three tests, zero failures |
| Parse CI YAML and assert the documentation-step commands | Passed using the available Python YAML parser |
| `git diff --check` | Passed |
| Compare all 50 captured implementation file hashes with the delivery manifest | Unchanged during this documentation task |

An initial workflow-parser attempt used an unavailable Node YAML package; validation was completed with the installed Python parser. No dependency or lockfile change was needed. Application runtime tests were not rerun for this documentation-only follow-up. Earlier application evidence remains separately labeled in [verification](verification-2026-09-09.md).

## Publication boundary

The gate is wired locally, not confirmed by a new hosted CI run. No commit, push, release tag, package publication or deployment was performed. Branch protection is not configured by these documentation rules. A future source delivery must reference its actual commit and hosted results.
