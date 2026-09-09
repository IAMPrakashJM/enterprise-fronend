# Frontend and documentation versioning

Policy version **1.0.0**, 9 September 2026. Adapted to this frontend from the [reference framework's versioning approach](https://github.com/pepbits/pepbits-framework/blob/769a4c0e267f15653ef0994bd8df7da2ef14fc42/docs/releases/VERSIONING.md).

## Separate identities

| Identity | Meaning in this repository |
| --- | --- |
| Package version | Actual `package.json` value for the monorepo, apps or shared package. Shared packages are currently private; a version does not prove registry publication. |
| Source identity | Exact Git commit, or base commit plus an explicit working-tree file/diff digest when changes are uncommitted. |
| Release tag/artifact | An actual immutable source tag and built artifact/checksum recorded when created. An unreleased note is not a tag. |
| Deployment identity | The actual deployment/release directory or environment revision; independent of a documentation date. |
| Documentation/testing version | `docs/testing/v1.0.0/` and policy versions. These change when the documented contract changes, not because a package was published. |
| Runtime contract version | Record versions, policy revisions, API schemas, draft/import/workflow revisions and database migration identities. Their compatibility must be evaluated independently. |

The current package identities are captured in the [working-tree manifest](unreleased/manifest-library-preferences-2026-09-09.json). No package version or release tag was created by this documentation change. The backend framework's Maven snapshot and browser-library versions must not be substituted for these frontend values.

## Selecting a future release version

Use a patch for a compatible correction, a minor version for an additive compatible capability, and a major version for a breaking public contract or behavior. Defaults, serialized/API fields, policy meaning, data compatibility and dependencies count as observable contracts, not just exported TypeScript names.

Review affected apps and packages together. Do not change one package version while leaving its dependent examples/manifests inconsistent. Keep unsupported/unpublished workspace packages explicit. Do not create fictional historical releases from commit counts or dates.

## Release sequence

1. Maintain current changes under unreleased notes with stable feature/case IDs.
2. Choose the intended version, scope, supported environments and compatibility baseline.
3. Prepare the exact source identity, package manifest, integration/upgrade instructions and rollback plan.
4. Run appropriate code, API, browser and product/native acceptance against the release candidate. Record unsupported or pending environments.
5. Retain sanitized evidence and artifact checksums; obtain the normal review required by the repository/user's workflow.
6. Perform only authorized commit/tag/push/publication/deployment actions. Record each outcome separately, including failures.
7. Verify the actual deployed artifact before marking deployment complete. Preserve tags, evidence and versioned artifacts; issue a new correction record/version rather than rewriting their history.

## Documentation changes

Feature guides may evolve with the current implementation. Accepted testing-guide versions and recorded release evidence are historical contracts: use a new version/record for substantive revisions, and dated corrections for factual errors. Update the current pointer and changelog. Keep old URLs usable.

Documentation-only changes need documentation validation, not fabricated fresh runtime results. CI configuration is enforceable only when executed; branch protection/required checks are repository settings and are not established by Markdown.
