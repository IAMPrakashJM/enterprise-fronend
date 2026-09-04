"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AudioLines, BadgeCheck, CircleAlert, Eye, RefreshCw, Save, ShieldAlert, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from "@pepbits/ops-ui";
import { useSession } from "@pepbits/auth";
import type { AiConfig, AiUsage } from "@pepbits/ai-config";
import { clearAiCredential, fetchAiConfig, fetchAiUsage, saveAiConfig, setAiCredential, setAiScopedCredential, verifyAiCredential } from "@pepbits/ai-client";

/**
 * The administration surface.
 *
 * Every client function in ai-client/admin existed for two tasks with nothing
 * rendering them, so the only way to configure a provider was curl with a
 * bearer token. This is that screen.
 *
 * Two rules it is built to keep:
 *
 * IT NEVER SHOWS A CREDENTIAL. There is no state here that holds one after
 * submit, no field populated from the server, and nothing to reveal — the
 * "show" affordance a password input usually earns is absent on purpose,
 * because there would be nothing behind it. What is shown is the status: four
 * characters, a hash prefix, who set it and when.
 *
 * THE DISABLED STATE IS NOT THE ENFORCEMENT POINT. Writes are refused by the
 * server on the session's role. This screen greys the controls as a courtesy so
 * a non-admin is not invited to fill a form that will 403, and says so in as
 * many words — a UI that implied it were the gate would be the more dangerous
 * of the two lies.
 */

function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] py-2.5 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[length:calc(10.5px*var(--fs-scale))] font-bold">{label}</div>
        {hint ? <div className="mt-0.5 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">{hint}</div> : null}
      </div>
      <div className="shrink-0 text-right text-[length:calc(10px*var(--fs-scale))] font-semibold tabular-nums">{children}</div>
    </div>
  );
}

function Meter({ used, of, label }: { used: number; of: number; label: string }) {
  const pct = of > 0 ? Math.min(100, Math.round((used / of) * 100)) : 0;
  /* Colour turns at 75%, not at 100%. A budget that only looks alarming once it
     is spent has told you at the one moment you can no longer act on it. */
  const tone = pct >= 100 ? "var(--danger)" : pct >= 75 ? "var(--warning)" : "var(--primary)";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[length:calc(9px*var(--fs-scale))] font-bold uppercase tracking-[.08em] text-[var(--text-muted)]">{label}</span>
        <span className="text-[length:calc(10px*var(--fs-scale))] font-extrabold tabular-nums">{used.toLocaleString()} / {of.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  );
}

export function AiAdministration() {
  const { user } = useSession();
  const [config, setConfig] = useState<AiConfig | null>(null);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [secret, setSecret] = useState("");
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "bad"; text: string; detail?: string } | null>(null);

  const load = useCallback(async () => {
    const [c, u] = await Promise.all([fetchAiConfig(), fetchAiUsage()]);
    if (c.data) {
      setConfig(c.data);
      setDraft({
        providerId: c.data.provider.id, providerLabel: c.data.provider.label, endpoint: c.data.provider.endpoint,
        modelId: c.data.model.id, modelLabel: c.data.model.label, contextWindow: String(c.data.model.contextWindow),
        requestsPerMinute: String(c.data.limits.requestsPerMinute), tokensPerDay: String(c.data.limits.tokensPerDay),
        maxContextFields: String(c.data.limits.maxContextFields),
      });
    } else {
      setNote({ tone: "bad", text: c.error ?? "The AI configuration could not be read.", detail: c.detail });
    }
    if (u.data) setUsage(u.data);
  }, []);

  useEffect(() => { void load(); }, [load]);

  /* Advisory only. The server decides; see the header. */
  const mayWrite = user?.role === "enterprise-admin";

  const act = async (key: string, run: () => Promise<{ ok: boolean; error?: string; detail?: string }>, success: string) => {
    setBusy(key); setNote(null);
    const result = await run();
    setBusy(null);
    setNote(result.ok ? { tone: "ok", text: success } : { tone: "bad", text: result.error ?? "The change was refused.", detail: result.detail });
    await load();
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-[length:calc(11px*var(--fs-scale))] text-[var(--text-muted)]">
        {note ? <><b className="text-[var(--danger)]">{note.text}</b>{note.detail ? <div className="mt-1">{note.detail}</div> : null}</> : "Loading the AI configuration…"}
      </div>
    );
  }

  const credential = config.credential;

  return (
    <div className="nex-scrollbar h-full overflow-y-auto p-4">
      <div className="mx-auto grid max-w-5xl gap-4">
        {!mayWrite ? (
          <div className="flex items-start gap-2.5 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] p-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[var(--warning)]" />
            <div className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed">
              <b>Read only for this session.</b> Signed in as <b>{user?.role ?? "an unknown role"}</b>; administrative writes need <b>enterprise-admin</b>.
              The controls below are greyed as a courtesy — the refusal happens on the server, not here.
            </div>
          </div>
        ) : null}

        {note ? (
          <div className={cn("flex items-start gap-2.5 rounded-[var(--radius)] border p-3",
            note.tone === "ok"
              ? "border-[color-mix(in_srgb,var(--success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--success)_10%,transparent)]"
              : "border-[color-mix(in_srgb,var(--danger)_35%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]")}>
            {note.tone === "ok" ? <BadgeCheck className="mt-0.5 size-4 shrink-0 text-[var(--success)]" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />}
            <div className="text-[length:calc(9.5px*var(--fs-scale))] leading-relaxed"><b>{note.text}</b>{note.detail ? <div className="mt-0.5 text-[var(--text-muted)]">{note.detail}</div> : null}</div>
          </div>
        ) : null}

        {/* ---- credential ---------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle title="Provider credential" subtitle="Write-only — set and replaced here, never read back." />
            <Badge tone={credential.configured ? "success" : "neutral"}>{credential.configured ? "configured" : "not set"}</Badge>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              Write-only. The value is never returned by any endpoint, so it cannot be shown here or checked by eye —
              the last four characters and a fingerprint are what distinguish one key from another. Use <b>Verify</b> to
              find out whether it still works.
            </p>
            <Row label="Ends with" hint="Four characters. Enough to tell two keys apart, not enough to be one.">{credential.hint ?? "—"}</Row>
            <Row label="Fingerprint" hint="SHA-256 prefix, for matching against a vault record.">
              <span className="font-mono text-[length:calc(9px*var(--fs-scale))]">{credential.fingerprint ?? "—"}</span>
            </Row>
            <Row label="Set by">{credential.setBy ?? "—"}</Row>
            <Row label="First set">{credential.setAt ? new Date(credential.setAt).toLocaleString() : "—"}</Row>
            <Row label="Last rotated" hint="Distinct from first set: an incident usually turns on when it last changed.">
              {credential.rotatedAt ? new Date(credential.rotatedAt).toLocaleString() : "never"}
            </Row>
            <Row label="Last verified">{credential.lastVerifiedAt ? new Date(credential.lastVerifiedAt).toLocaleString() : "never"}</Row>
            {credential.lastError ? (
              <Row label="Last error"><span className="text-[var(--danger)]">{credential.lastError}</span></Row>
            ) : null}

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-56 flex-1">
                <Input
                  label={credential.configured ? "Replace the key" : "Set the key"}
                  type="password"
                  autoComplete="off"
                  placeholder="Paste the provider key"
                  hint="Submitted once and not kept in this page."
                  value={secret}
                  disabled={!mayWrite}
                  onChange={(event) => setSecret(event.target.value)}
                />
              </div>
              <Button size="sm" variant="primary" leftIcon={<Save className="size-3.5" />}
                disabled={!mayWrite || !secret.trim() || busy !== null}
                onClick={() => void act("set", async () => {
                  const result = await setAiCredential(secret.trim());
                  /* Cleared whatever happened. A rejected key left in the box is
                     a key sitting in the DOM for no reason. */
                  setSecret("");
                  return result;
                }, credential.configured ? "The key was replaced." : "The key was set.")}>
                {busy === "set" ? "Saving…" : credential.configured ? "Replace" : "Set key"}
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Eye className="size-3.5" />}
                disabled={!mayWrite || !credential.configured || busy !== null}
                onClick={() => void act("verify", () => verifyAiCredential(), "The provider accepted the key.")}>
                {busy === "verify" ? "Verifying…" : "Verify"}
              </Button>
              <Button size="sm" variant="danger" leftIcon={<Trash2 className="size-3.5" />}
                disabled={!mayWrite || !credential.configured || busy !== null}
                onClick={() => void act("clear", () => clearAiCredential(), "The key was removed. The assistant falls back to its echo transport.")}>
                Remove
              </Button>
            </div>
            <p className="mt-2 text-[length:calc(8.5px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              Verifying and removing both reach the provider or the store, so both are audited and both count against
              the rate limit below. Removing cannot be undone from here — the old value is unreadable by design.
            </p>
          </CardContent>
        </Card>

        {/* ---- provider ------------------------------------------------ */}
        <Card>
          <CardHeader><CardTitle title="Provider and model" subtitle="Where dispatch sends, and as what." /></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Input label="Provider id" value={draft.providerId ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, providerId: e.target.value })} />
              <Input label="Provider label" value={draft.providerLabel ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, providerLabel: e.target.value })} />
              <Input className="md:col-span-2" label="Endpoint" placeholder="https://…" hint="The base URL. Dispatch appends /chat/completions."
                value={draft.endpoint ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })} />
              <Input label="Model id" value={draft.modelId ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, modelId: e.target.value })} />
              <Input label="Model label" value={draft.modelLabel ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, modelLabel: e.target.value })} />
              <Input label="Context window" type="number" min={0} value={draft.contextWindow ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, contextWindow: e.target.value })} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="primary" leftIcon={<Save className="size-3.5" />} disabled={!mayWrite || busy !== null}
                onClick={() => void act("provider", () => saveAiConfig({
                  provider: { id: draft.providerId ?? "", label: draft.providerLabel ?? "", endpoint: draft.endpoint ?? "" },
                  model: { id: draft.modelId ?? "", label: draft.modelLabel ?? "", contextWindow: Number(draft.contextWindow) || 0 },
                }), "Provider and model saved.")}>
                {busy === "provider" ? "Saving…" : "Save provider"}
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<RefreshCw className="size-3.5" />} onClick={() => void load()}>Reload</Button>
            </div>
          </CardContent>
        </Card>

        {/* ---- limits and spend ---------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle title="Limits and spend" subtitle="What is allowed, and what has been used." />
            {usage?.limitsAreDefaults ? <Badge tone="warning">defaults in use</Badge> : null}
          </CardHeader>
          <CardContent>
            {usage ? (
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <Meter label="Requests this minute" used={usage.requestsLastMinute} of={usage.requestsPerMinute} />
                <Meter label={`Tokens today · ${usage.day} UTC`} used={usage.tokensUsedToday} of={usage.tokensPerDay} />
              </div>
            ) : null}
            <p className="mb-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              A missing, zero or malformed limit resolves to the server's default rather than to no limit at all —
              which is why <b>defaults in use</b> is worth showing: 20 because someone chose 20 and 20 because nothing
              is configured look identical in the number alone.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <Input label="Requests per minute" type="number" min={1} value={draft.requestsPerMinute ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, requestsPerMinute: e.target.value })} />
              <Input label="Tokens per day" type="number" min={1} value={draft.tokensPerDay ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, tokensPerDay: e.target.value })} />
              <Input label="Max context fields" type="number" min={1} hint="Assembly is truncated to this." value={draft.maxContextFields ?? ""} disabled={!mayWrite} onChange={(e) => setDraft({ ...draft, maxContextFields: e.target.value })} />
            </div>
            <Button className="mt-3" size="sm" variant="primary" leftIcon={<Save className="size-3.5" />} disabled={!mayWrite || busy !== null}
              onClick={() => void act("limits", () => saveAiConfig({
                limits: {
                  requestsPerMinute: Number(draft.requestsPerMinute) || 0,
                  tokensPerDay: Number(draft.tokensPerDay) || 0,
                  maxContextFields: Number(draft.maxContextFields) || 0,
                },
              }), "Limits saved.")}>
              {busy === "limits" ? "Saving…" : "Save limits"}
            </Button>
          </CardContent>
        </Card>

        {/* ---- speech providers ----------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle title="Speech providers" subtitle="Priority order for transcription; the first that can run is used." />
            <Badge tone="neutral">{config.speech?.providers?.length ?? 0} configured</Badge>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              The gateway picks the lowest priority number that is enabled, supports the session language, and has a credential.
              A provider that is enabled but has no key is <b>skipped, not attempted</b> — failing at call time would turn a
              configuration mistake into an outage in the middle of a consultation.
            </p>
            {(config.speech?.providers ?? []).map((sp) => (
              <div key={sp.id} className="mb-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <AudioLines className="size-3.5 text-[var(--primary)]" />
                  <b className="text-[length:calc(10.5px*var(--fs-scale))]">{sp.label}</b>
                  <Badge tone={sp.enabled ? "success" : "neutral"}>{sp.enabled ? "enabled" : "disabled"}</Badge>
                  <Badge tone="neutral">priority {sp.priority}</Badge>
                  {sp.credential?.configured ? <Badge tone="success">key ····{sp.credential.hint}</Badge> : <Badge tone="warning">no key</Badge>}
                  <span className="flex-1" />
                  <span className="text-[length:calc(9px*var(--fs-scale))] text-[var(--text-muted)]">
                    {sp.model} · {(sp.languages ?? []).join(", ")}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <div className="min-w-48 flex-1">
                    <Input label={`${sp.label} key`} type="password" autoComplete="off" placeholder="Paste the provider key"
                      disabled={!mayWrite} value={secrets[sp.id] ?? ""} onChange={(e) => setSecrets({ ...secrets, [sp.id]: e.target.value })} />
                  </div>
                  <Button size="sm" variant="primary" disabled={!mayWrite || !(secrets[sp.id] ?? "").trim() || busy !== null}
                    onClick={() => void act(`sp-${sp.id}`, async () => {
                      const r = await setAiScopedCredential(`speech:${sp.id}`, (secrets[sp.id] ?? "").trim());
                      setSecrets({ ...secrets, [sp.id]: "" });
                      return r;
                    }, `${sp.label} key stored.`)}>
                    {busy === `sp-${sp.id}` ? "Saving…" : "Set key"}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={!mayWrite || busy !== null}
                    onClick={() => void act(`sp-toggle-${sp.id}`, () => saveAiConfig({
                      speech: { ...config.speech, providers: (config.speech?.providers ?? []).map((x) => x.id === sp.id ? { ...x, enabled: !x.enabled } : x) },
                    } as never), `${sp.label} ${sp.enabled ? "disabled" : "enabled"}.`)}>
                    {sp.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            ))}
            <p className="mt-1 text-[length:calc(8.5px*var(--fs-scale))] leading-relaxed text-[var(--text-subtle)]">
              Only the built-in mock transcriber runs in this build. The other adapters are declared with their real call shapes
              and have never been exercised — a session on one reports that rather than producing a transcript.
            </p>
          </CardContent>
        </Card>

        {/* ---- prompts ------------------------------------------------- */}
        <Card>
          <CardHeader><CardTitle title="Prompts" subtitle="Ids and versions. The text stays on the server." /><Badge tone="neutral">{config.prompts.length} registered</Badge></CardHeader>
          <CardContent>
            <p className="mb-2 text-[length:calc(9px*var(--fs-scale))] leading-relaxed text-[var(--text-muted)]">
              Ids and versions only. Prompt <b>text</b> is resolved server-side at dispatch and is never sent to a
              browser, so it cannot be read, replayed or edited from here — changing one is a server deployment.
            </p>
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-left text-[length:calc(9.5px*var(--fs-scale))]">
                <thead>
                  <tr className="bg-[var(--surface-2)]">
                    {["Prompt id", "Use case", "Version", "Updated"].map((h) => (
                      <th key={h} className="px-3 py-2 text-[length:calc(8.5px*var(--fs-scale))] font-black uppercase tracking-[.08em] text-[var(--text-subtle)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.prompts.map((prompt) => (
                    <tr key={prompt.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-2 font-mono">{prompt.id}</td>
                      <td className="px-3 py-2">{prompt.useCaseId}</td>
                      <td className="px-3 py-2 tabular-nums">v{prompt.version}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{new Date(prompt.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ---- handling ------------------------------------------------ */}
        <Card>
          <CardHeader><CardTitle title="Retention and data sharing" subtitle="How the provider is permitted to handle what it is sent." /></CardHeader>
          <CardContent>
            <Row label="Retention class">{config.retention.class}</Row>
            <Row label="Retention period">{config.retention.days} days</Row>
            <Row label="Provider trains on content" hint="Must stay false for protected content.">
              <Badge tone={config.dataSharing.providerTrainsOnContent ? "danger" : "success"}>
                {config.dataSharing.providerTrainsOnContent ? "yes" : "no"}
              </Badge>
            </Row>
            <Row label="Processing region">{config.dataSharing.region}</Row>
            <Row label="Tenant">{config.tenantId}</Row>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
