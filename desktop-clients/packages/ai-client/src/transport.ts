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
 * There is no provider here and no credential anywhere, so this echoes the
 * assembled context back. That is not a placeholder to be swapped out casually:
 * it exercises the ENTIRE path — gates, assembly, redaction, the transparency
 * confirmation — with nothing secret in existence, which is what makes the
 * whole client half reviewable before a key is ever issued.
 *
 * The real path is a POST to the AI service, which resolves the prompt, attaches
 * the credential and calls the provider. The browser never learns any of that;
 * see spec D6.
 */
export async function dispatchAi(context: AiContext, useCase: AiUseCase): Promise<AiReply> {
  const lines = [
    `Mock reply for "${useCase.label}".`,
    "",
    `No provider is configured, so nothing left this browser. What WOULD have been sent, after redaction, is the ${context.fields.length} field${context.fields.length === 1 ? "" : "s"} shown on the Data tab:`,
    "",
    ...context.fields.map((field) => `  • ${field.label}: ${field.value}${field.redacted ? "  (redacted)" : ""}`),
    "",
    `Prompt ${useCase.promptId} would be resolved server-side. The prompt text is never sent to, or held by, this browser.`,
  ];
  /* A beat of latency, so the panel's pending state is exercised rather than
     skipped straight past in every manual test. */
  await new Promise((resolve) => setTimeout(resolve, 350));
  return { ok: true, text: lines.join("\n"), via: "mock" };
}
