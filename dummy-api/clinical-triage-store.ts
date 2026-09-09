import { readFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { parseCsv, writeCsvSnapshot } from "./clinical-template-csv.ts";
import {
  TRIAGE_VITALS,
  validateTriage,
} from "../desktop-clients/packages/erp-config/src/clinical-triage.ts";
import type {
  TriageAssessment,
  TriageView,
  TriageSave,
  TriageConfiguration,
} from "../desktop-clients/packages/erp-config/src/clinical-triage.ts";
import type { PatientOverview } from "../desktop-clients/packages/erp-config/src/clinical-templates.ts";
type User = { id: string; tenantId?: string; name?: string };
type Result = { status: number; body: unknown };
type Bucket = {
  assessments: TriageAssessment[];
  receipts: Record<string, { hash: string; record: TriageAssessment }>;
};
const config = JSON.parse(
  readFileSync(
    new URL("./config/clinical-triage/form.json", import.meta.url),
    "utf8",
  ),
) as TriageConfiguration;
const fail = (
  status: number,
  key: string,
  fieldErrors: Record<string, string> = {},
): Result => ({
  status,
  body: {
    error: "template.triage." + key,
    fieldErrors: {
      ...fieldErrors,
      ...(Object.keys(fieldErrors).length
        ? {}
        : { form: "template.triage." + key }),
    },
  },
});
/** Single-process CSV assessment journal, isolated from registration and billing. */
export function createClinicalTriageStore(
  file: string,
  overview: (user: User, product: string, id: string) => Result,
) {
  const read = (): Record<string, Bucket> => {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT")
        return Object.create(null);
      throw e;
    }
    const [header, ...rows] = parseCsv(text);
    if (header?.join(",") !== "tenant,application,patient,data")
      throw Error("Invalid triage CSV");
    const data: Record<string, Bucket> = Object.create(null);
    for (const cells of rows) {
      if (cells.length !== 4) throw Error("Invalid triage row");
      const [tenant, product, patient, json] = cells,
        key = JSON.stringify([tenant, product, patient]);
      if (data[key]) throw Error("Duplicate triage scope");
      const bucket = JSON.parse(json) as Bucket;
      if (
        !Array.isArray(bucket.assessments) ||
        !bucket.receipts ||
        bucket.assessments.some(
          (r) =>
            r.patientId !== patient ||
            !Number.isSafeInteger(r.version) ||
            r.version < 1 ||
            !["draft", "completed"].includes(r.status),
        )
      )
        throw Error("Invalid triage snapshot");
      data[key] = bucket;
    }
    return data;
  };
  const persist = (data: Record<string, Bucket>) => {
    const quote = (v: string) => '"' + v.replaceAll('"', '""') + '"';
    writeCsvSnapshot(
      file,
      "tenant,application,patient,data\r\n" +
        Object.entries(data)
          .map(([key, b]) =>
            [...JSON.parse(key), JSON.stringify(b)].map(quote).join(","),
          )
          .join("\r\n") +
        "\r\n",
    );
  };
  return {
    handle(
      user: User,
      product: string,
      input: unknown,
      canWrite: boolean,
    ): Result {
      if (!input || typeof input !== "object" || Array.isArray(input))
        return fail(400, "invalid");
      const body = input as TriageSave & { action: string };
      if (
        typeof body.patientId !== "string" ||
        !body.patientId ||
        body.patientId.length > 100
      )
        return fail(400, "invalid");
      const response = overview(user, product, body.patientId);
      if (response.status !== 200) return response;
      const patient = response.body as PatientOverview,
        key = JSON.stringify([
          user.tenantId ?? "demo",
          product,
          body.patientId,
        ]),
        data = read(),
        bucket = (data[key] ??= {
          assessments: [],
          receipts: Object.create(null),
        }),
        now = new Date().toISOString();
      const blank: TriageAssessment = {
        id: "new",
        patientId: body.patientId,
        encounterId: "",
        version: 0,
        status: "draft",
        values: {
          complaint: "",
          onset: "",
          priority: "",
          allergyStatus: "",
          allergies: "",
          precautions: "",
          destination: "",
          handoff: "",
          missingReason: "",
          measuredAt: now,
          vitals: Object.fromEntries(
            TRIAGE_VITALS.map((k) => [k, ""]),
          ) as TriageAssessment["values"]["vitals"],
        },
        updatedAt: "",
        actor: "",
        history: [],
      };
      const view: TriageView = {
        patient: patient.patient,
        encounters: patient.rows.filter((r) => r.kind === "encounter"),
        assessments: bucket.assessments,
        blank,
        config,
        canWrite,
      };
      if (body.action === "load") return { status: 200, body: view };
      if (body.action !== "save") return fail(400, "invalid");
      if (!canWrite) return fail(403, "denied");
      if (
        typeof body.operationId !== "string" ||
        !body.operationId ||
        body.operationId.length > 100 ||
        typeof body.complete !== "boolean" ||
        !Number.isSafeInteger(body.expectedVersion) ||
        !body.assessment?.values ||
        body.assessment.patientId !== body.patientId
      )
        return fail(400, "invalid");
      const op = JSON.stringify([user.id, body.operationId]),
        hash = createHash("sha256").update(JSON.stringify(body)).digest("hex"),
        receipt = bucket.receipts[op];
      if (receipt)
        return receipt.hash === hash
          ? { status: 200, body: receipt.record }
          : fail(409, "conflict");
      const record = body.assessment,
        old = bucket.assessments.find((r) => r.id === record.id);
      if (record.id !== "new" && !old) return fail(404, "notFound");
      if ((old?.version ?? 0) !== body.expectedVersion)
        return fail(409, "conflict");
      if (old?.status === "completed") return fail(409, "completedLocked");
      if (
        typeof record.encounterId !== "string" ||
        record.encounterId.length > 100 ||
        (record.encounterId &&
          !view.encounters.some((e) => e.id === record.encounterId))
      )
        return fail(400, "invalid", { encounterId: "template.triage.invalid" });
      const errors = validateTriage(record.values, config, body.complete);
      if (Object.keys(errors).length) return fail(400, "invalid", errors);
      // Whitelist fields: the server owns identity, status, actor, revision and history.
      const values = Object.fromEntries(
        Object.keys(blank.values)
          .filter((k) => k !== "vitals")
          .map((k) => [k, record.values[k as keyof typeof record.values]]),
      ) as unknown as TriageAssessment["values"];
      values.vitals = Object.fromEntries(
        TRIAGE_VITALS.map((k) => [k, record.values.vitals[k]]),
      ) as TriageAssessment["values"]["vitals"];
      const saved: TriageAssessment = {
        id: old?.id ?? "TRI-" + randomUUID(),
        patientId: body.patientId,
        encounterId: record.encounterId,
        version: (old?.version ?? 0) + 1,
        status: body.complete ? "completed" : "draft",
        values,
        updatedAt: now,
        actor: user.name ?? user.id,
        history: [
          ...(old?.history ?? []),
          {
            at: now,
            actor: user.name ?? user.id,
            messageKey: body.complete
              ? "template.triage.event.completed"
              : "template.triage.event.saved",
          },
        ],
      };
      bucket.assessments = [
        saved,
        ...bucket.assessments.filter((r) => r.id !== saved.id),
      ];
      bucket.receipts[op] = { hash, record: saved };
      data[key] = bucket;
      persist(data);
      return { status: 200, body: saved };
    },
  };
}
