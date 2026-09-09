# Development and documentation workflow

Start with [mandatory rules](RULES.md), [feature guidance](../features/README.md), [current tests](../testing/README.md) and the [unreleased delivery](../releases/unreleased/README.md).

## Adding a feature

1. Identify the user task, target applications, existing shared components and applicable preferences.
2. Record scope and acceptance using the [feature template](../releases/templates/feature.md). Give the feature and its test cases stable IDs.
3. Define the typed configuration, adapter, policy and failure contracts before integrating the page. Reuse a supported engine when it fits the task.
4. Implement source, backend demo contract and translated copy together where relevant. Register the page with the frontend, API navigation and authorized product.
5. Add or update the dedicated user help and integration instructions. Repository Markdown and the in-app documentation catalogs are distinct deliverables.
6. Exercise meaningful success, permission, validation, failure/retry and managed-preference cases. Update the current inventory when its scope changes; introduce a new testing-document version for a substantive accepted contract revision.
7. Update the unreleased notes with implemented, changed, fixed, deprecated or removed behavior. Attach source identity and actual evidence.
8. Run documentation validation and the appropriate code/browser checks. Publication and deployment remain explicit delivery actions, with their own records.

## Changing or removing behavior

A new validation, required field, default, export restriction or removed action is observable behavior. Explain the old and new behavior, affected pages, handling of existing records, integration impact and user guidance. Update the runtime documentation/release-change catalogs if the application should show an alert. Do not claim that adding a Markdown release note automatically creates an in-app notification.

For public type changes, identify affected consumers. For backend or storage changes, include forward/backward compatibility, migration prerequisites and rollback limits. A cosmetic label change may need only copy and documentation checks; a policy-resolution change needs meaningful runtime lock tests.

## Documentation-only changes

Update links, version pointers, templates, rules and evidence without rewriting application history. Validate the documentation gate. Reuse earlier runtime evidence only with its original scope/source labels; do not change its date or status to imply it was rerun.

If the documentation gate or CI configuration changes, test the gate and check workflow wiring. A new CI step is configured locally until the branch is pushed and the hosted run actually executes.
