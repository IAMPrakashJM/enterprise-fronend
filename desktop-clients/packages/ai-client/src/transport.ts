import { authedFetch } from "@pepbits/auth";
import type { AiContext, AiUseCase } from "@pepbits/ai-config";

export interface AiReply {
  ok: boolean;
  /** Present on success. Plain text; the panel does not render markup it was
      given by a model. */
  text?: string;
  error?: string;
  detail?: string;
  /** Which transport answered, shown in the panel so a mock is never mistaken
      for a real answer. */
  via: "mock" | "service";
}

/**
 * Dispatch.
 *
 * POSTs the assembled, redacted context to the AI service, which resolves the
 * prompt from `promptId`, attaches the credential and calls the provider. The
 * browser sends neither prompt text nor a key, and learns neither; see spec D6.
 *
 * Falls back to the echo transport when no provider answers, and says so. The
 * fallback is NOT a silent degradation: `via` is what the panel renders its
 * "no provider was contacted" banner from, so a mock can never be mistaken for
 * a real answer. That distinction is the reason this returns `via` at all.
 */
export async function dispatchAi(context: AiContext, useCase: AiUseCase): Promise<AiReply> {
  const response = await authedFetch("/ai/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    /* The promptId, not a prompt. The service will not accept text here, and
       there is none in this bundle to send. */
    body: JSON.stringify({
      useCaseId: useCase.id,
      promptId: useCase.promptId,
      pageId: context.pageId,
      fields: context.fields.map((field) => ({ label: field.label, value: field.value })),
      ...(context.userInput ? { userInput: context.userInput } : {}),
    }),
  }).catch(() => null);

  /* Read the body ONCE. A Response body can only be consumed a single time, so
     branching on status first and parsing in each arm silently yields null on
     the second read. */
  const body = response ? ((await response.json().catch(() => null)) as { text?: string; error?: string; detail?: string } | null) : null;

  if (response?.ok && body?.text) return { ok: true, text: body.text, via: "service" };

  /* 409 means no credential is configured: nothing could have been sent, which
     is the ordinary unconfigured state rather than a failure. Everything else
     keeps the service's own message. */
  if (response && response.status !== 409) {
    return { ok: false, error: body?.error ?? `The AI service returned ${response.status}.`, detail: body?.detail, via: "service" };
  }

  return mockReply(context, useCase);
}

/**
 * The echo transport.
 *
 * Kept, and kept reachable, because it exercises the ENTIRE path — gates,
 * assembly, redaction, the transparency confirmation — with no credential in
 * existence. That is what made the client half reviewable before a key was
 * issued, and it is what the system falls back to the moment one is removed.
 */
async function mockReply(context: AiContext, useCase: AiUseCase): Promise<AiReply> {
  const lines = [
    `Mock reply for "${useCase.label}".`,
    "",
    `No provider is configured, so nothing left this browser. What WOULD have been sent, after redaction, is the ${context.fields.length} field${context.fields.length === 1 ? "" : "s"} shown on the Data tab:`,
    "",
    ...context.fields.map((field) => `  \u2022 ${field.label}: ${field.value}${field.redacted ? "  (redacted)" : ""}`),
    "",
    `Prompt ${useCase.promptId} would be resolved server-side. The prompt text is never sent to, or held by, this browser.`,
  ];
  /* A beat of latency, so the panel's pending state is exercised rather than
     skipped straight past in every manual test. */
  await new Promise((resolve) => setTimeout(resolve, 350));
  return { ok: true, text: lines.join("\n"), via: "mock" };
}
