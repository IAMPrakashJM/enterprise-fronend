# Testing documentation

Current testing-document version: **[1.0.0](v1.0.0/PRE-COMMIT.md)**. This is the first versioned documentation baseline here; it does not replace the frontend's package version or invent a product release.

- [Pre-commit/change verification](v1.0.0/PRE-COMMIT.md)
- [Library renderer matrix](v1.0.0/MODULE-MATRIX.md)
- [Stable acceptance cases](v1.0.0/USE-CASES.md)
- [Machine-readable inventory](v1.0.0/inventory.json)
- [Active version pointer](current.json)
- [Testing-guide changes](CHANGELOG.md)
- [Recorded delivery evidence](../releases/unreleased/verification-2026-09-09.md)

The current inventory covers 158 Library destinations, including five Registry design family additions, Billing Clinic, Clinical Triage, Clinical Consultation OP Consultation and Comprehensive Consultation, plus OP Registration and the List of pages catalog. Earlier evidence covers the 129-route baseline. Navigation coverage, rendering a shared engine, automated business-flow tests and production acceptance are separate measurements. Do not sum overlapping suite counts or call every setting combination tested.

The documentation checker validates links, pointer structure, route/test inventory and release-record requirements. It does not execute application tests or establish access-control correctness. The runtime gates remain necessary for implementation changes.

Four healthcare reference pages add emergency registration, inpatient admission and two consultation designs; see CARE-01.

## Latest retained implementation evidence

The [healthcare page delivery](../releases/unreleased/care-page-templates-2026-09-10.md) records 1,536 frontend tests, 126 API tests, both builds and repository gates against its identified source. Its [deployment follow-up](../releases/unreleased/care-page-deployment-2026-09-10.md) records read-only Chromium acceptance on both public sites. These results belong to that source and scope; this documentation refresh does not rerun or relabel them.
