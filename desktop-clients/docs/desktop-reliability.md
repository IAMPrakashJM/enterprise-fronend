# Desktop reliability batch

7 September 2026.

Implemented:

- Workspace-owned, session-only draft state for schema-driven record forms.
  Values, saved baseline, section and save time survive screen suspension and
  remount. Discard restores the baseline. Closing with discard, authorization
  refusal, tenant change and workspace logout erase retained state. Restore
  metadata does not contain draft values.
- AI sources are scoped to the owning document. The global panel reads the
  focused document; inline assistants read their own document and page. Multiple
  mounted copies use unique publication identities so one cannot retract another.
- Only the focused document handles Alt+S, including when both split panes are
  visible.
- Native window operations are serialized through lifecycle cleanup. Unmounting
  the authenticated workspace closes its windows, including pending creation.
  Failed opens return the document to the main workspace. Tauri open waits for
  its actual creation event before reporting success.
- Session providers observe token changes/clears from other windows and
  invalidate themselves on current-token API 401s. Request generations prevent
  old validation or login responses from restoring a logged-out session.
- Preferences are written only after a successful initial read and an explicit
  edit. Failed reads keep changes local and show a visible notice. The loading
  skeleton hint is now saved through reachable code.

Follow-up: the record/draft adapter now adds service-backed recovery, real saves,
retry and conflict handling to forms, billing and consultation. See
[record-editing.md](record-editing.md) for behavior, integration and verification.
The follow-up is now included in the public release below. Preference-save retry and
conflict UX remain separate work.

Verification: 358 targeted tests passed across workspace, form, AI, session,
preferences and native-port contracts. A Linux native Tauri debug build with
bundled production frontend assets also passed the WebDriver lifecycle check:
record detach/load, identifier-only OS title, native close request, reattachment,
reopen, child logout propagation and main logout closing its child. This exposed
and fixed a missing `core:window:allow-destroy` capability required by the SDK
close-request handler. No main-window runtime errors or preference writes occurred
in the checked journeys (preference responses are isolated by the test).
See [running-tauri.md](running-tauri.md) for reproduction and coverage limits.
Both production builds and isolated asset checks passed. Browser checks in both
shells confirmed a visible failed-settings notice, zero preference writes after
failed reads, and logout propagation to a second window. Desktop tab switching
retained an edited record. No page errors were observed in these journeys.

Release `20260907163215381-b9dabe79` is active on both public shells. Public HTTPS
release identity, HTML, assets, API health and authenticated record reads passed
after the coordinated API/frontend activation. The previous
release remains available for rollback.
