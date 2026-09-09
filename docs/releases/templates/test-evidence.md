# Verification <record ID>

Feature/release: <identity>. Testing guide: <version>.
Source: <exact commit, or base and clearly defined working-tree digest>.
Environment and capture time UTC: <actual versions/time>.
Executor/reviewer: <facts>. Hosted CI URL: <actual or not run>.
Scope: unit/mock / development-server browser / built artifact / native / live / product acceptance.

| Command | Result and retained exit status | Cases/suites | Artifact and SHA-256 |
| --- | --- | --- | --- |
| <command> | <passed/failed/not-run/blocked> | <measured count or N/A> | <durable relative link/hash> |

Explain overlapping counts. Record relevant failures, fixes and follow-up runs. Do not erase an initial failure just because a later run passed. State changes made after the full suite and which targeted checks covered them.

List limits, unsupported environments, unperformed acceptance and publication state. Keep credentials and real sensitive data out of attachments. Record summarized output as a summary, not a complete raw log.
