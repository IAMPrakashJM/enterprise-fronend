import type { AiContext, AiContextField, AiUseCase } from "@pepbits/ai-config";
import { redactField } from "./redact.ts";

/**
 * What a page can offer. Every key here is something the page already has on
 * screen — assembly reads state, it never fetches. Retrieval that goes and gets
 * more is how a use case widens its own scope (spec D5), so the assembler is
 * given data rather than the means to find it.
 */
export interface AiSources {
  "page-record"?: Record<string, unknown>;
  "worklist-selection"?: Array<Record<string, unknown>>;
  "form-values"?: Record<string, unknown>;
}

const SOURCE_LABEL: Record<string, string> = {
  "page-record": "This record",
  "worklist-selection": "Selected rows",
  "form-values": "Form values",
};

/** Turns a field key into something a person can match to the screen. */
function humanise(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function present(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

/**
 * Build the payload for one use case from what the page has.
 *
 * ONLY the fields the use case names are read. A key present in `sources` but
 * absent from `reads` never reaches the context, so a page that hands over its
 * whole record does not thereby widen the request — the use case is the
 * allowlist, and this is the function that enforces it.
 */
export function assembleContext(
  useCase: AiUseCase,
  pageId: string,
  sources: AiSources,
  userInput?: string,
): AiContext {
  const fields: AiContextField[] = [];

  for (const read of useCase.reads) {
    const sourceLabel = SOURCE_LABEL[read.source] ?? read.source;

    if (read.source === "worklist-selection") {
      const rows = sources["worklist-selection"] ?? [];
      rows.forEach((row, index) => {
        for (const key of read.fields) {
          const raw = row[key];
          if (!present(raw)) continue;
          const { value, redacted } = redactField(key, String(raw));
          fields.push({ label: `${humanise(key)} (row ${index + 1})`, value, source: sourceLabel, ...(redacted ? { redacted } : {}) });
        }
      });
      continue;
    }

    const record = sources[read.source] ?? {};
    for (const key of read.fields) {
      const raw = record[key];
      if (!present(raw)) {
        /* An absent optional field is simply omitted. An absent REQUIRED one is
           omitted too, rather than sent as "unknown": a placeholder in the
           payload is a value the model will reason about, and the panel would
           show a field the page never had. */
        continue;
      }
      const { value, redacted } = redactField(key, String(raw));
      fields.push({ label: humanise(key), value, source: sourceLabel, ...(redacted ? { redacted } : {}) });
    }
  }

  return {
    useCaseId: useCase.id,
    pageId,
    capturedAt: new Date().toISOString(),
    fields,
    ...(userInput ? { userInput } : {}),
  };
}

/** Every distinct source the assembled context drew from, for the Flow tab. */
export function contextSources(context: AiContext): string[] {
  return [...new Set(context.fields.map((field) => field.source))];
}
