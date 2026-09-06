import type { AiConfig, AiContext, AiContextField, AiUseCase } from "@pepbits/ai-config";

/**
 * Fixtures shared by the surface tests.
 *
 * A file rather than a copy in each: the panel, the terminal and the inline
 * action are three affordances over one engine, and three slightly different
 * fixtures would let them drift apart in exactly the way the design forbids.
 */

export const useCase = (over: Partial<AiUseCase> = {}): AiUseCase => ({
  id: "record.explain",
  label: "Explain this record",
  description: "Explains the fields on the open record and what its current status means.",
  reads: [{ source: "page-record", fields: ["id", "status"] }],
  promptId: "record.explain.v1",
  category: "general",
  ...over,
});

export const field = (over: Partial<AiContextField> = {}): AiContextField => ({
  key: "id",
  label: "Id",
  value: "C-100",
  source: "This record",
  ...over,
});

export const context = (over: Partial<AiContext> = {}): AiContext => ({
  useCaseId: "record.explain",
  pageId: "customer-master",
  capturedAt: "2026-09-06T00:00:00.000Z",
  fields: [field(), field({ key: "status", label: "Status", value: "Overdue" })],
  ...over,
});

export const config = (over: Partial<AiConfig> = {}): AiConfig => ({
  tenantId: "t1",
  provider: { id: "deepseek", label: "DeepSeek", endpoint: "https://api.deepseek.com/v1" },
  model: { id: "deepseek-chat", label: "DeepSeek Chat", contextWindow: 64000 },
  limits: { requestsPerMinute: 10, tokensPerDay: 100000, maxContextFields: 40 },
  prompts: [],
  retention: { class: "standard", days: 30 },
  dataSharing: { providerTrainsOnContent: false, region: "eu-central-1" },
  credential: { configured: true, hint: "sk-…f2a1" } as AiConfig["credential"],
  ...over,
});
