import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClinicalConsultationStore } from "./clinical-consultation-store.ts";
import type {
  ConsultationView,
  ConsultationRecord,
} from "../desktop-clients/packages/erp-config/src/clinical-consultation.ts";
test("consultation drafts persist, retry once, validate explicit entries, finalize immutably and isolate scope", () => {
  const dir = mkdtempSync(join(tmpdir(), "consultation-")),
    file = join(dir, "notes.csv");
  const open = () =>
    createClinicalConsultationStore(file, (_u, _p, id) => ({
      status: 200,
      body: {
        patient: { id, mrn: "DEMO", values: {} },
        rows: [
          {
            id: "visit",
            kind: "encounter",
            date: "2026-09-09",
            title: "Demo visit",
          },
        ],
      },
    }));
  const user = { id: "demo-user", tenantId: "tenant", name: "Demo Author" };
  try {
    let store = open();
    const view = store.handle(
      user,
      "app",
      { action: "load", patientId: "p" },
      true,
    ).body as ConsultationView;
    assert.ok(Object.values(view.blank.values).every((v) => v === ""));
    const body = {
      action: "save",
      patientId: "p",
      assessment: view.blank,
      expectedVersion: 0,
      operationId: "one",
      complete: true,
    };
    assert.equal(store.handle(user, "app", body, true).status, 400);
    body.complete = false;
    body.assessment.values.complaint = "Fictional concern";
    assert.equal(store.handle(user, "app", body, false).status, 403);
    const saved = store.handle(user, "app", body, true);
    assert.equal(saved.status, 200);
    store = open();
    assert.deepEqual(store.handle(user, "app", body, true), saved);
    const record = saved.body as ConsultationRecord;
    assert.ok(readFileSync(file, "utf8").includes(record.id));
    const completed = {
      ...record,
      encounterId: "visit",
      values: {
        ...record.values,
        clinician: view.config.clinicians[0].value,
        visitType: "new",
        examination: "Recorded findings",
        diagnosis: "Clinician assessment",
        treatment: "Documented plan",
        followUp: "Review plan",
        allergyReview: "reviewed",
      },
    };
    const mutation = {
      ...body,
      assessment: completed,
      expectedVersion: record.version,
      operationId: "complete",
      complete: true,
    };
    assert.equal(
      store.handle(user, "app", { ...mutation, expectedVersion: 0 }, true)
        .status,
      409,
    );
    assert.equal(
      store.handle(
        user,
        "app",
        { ...mutation, assessment: { ...completed, encounterId: "other" } },
        true,
      ).status,
      400,
    );
    assert.equal(
      store.handle(
        user,
        "app",
        {
          ...mutation,
          assessment: {
            ...completed,
            values: { ...completed.values, clinician: "forged" },
          },
        },
        true,
      ).status,
      400,
    );
    assert.equal(
      store.handle({ ...user, tenantId: "other" }, "app", mutation, true)
        .status,
      404,
    );
    const done = store.handle(user, "app", mutation, true);
    assert.equal(done.status, 200);
    assert.deepEqual(store.handle(user, "app", mutation, true), done);
    const final = done.body as ConsultationRecord;
    assert.equal(final.status, "completed");
    assert.equal(final.actor, user.name);
    assert.equal(final.history.length, 2);
    assert.equal(
      store.handle(
        user,
        "app",
        {
          ...mutation,
          operationId: "edit",
          expectedVersion: final.version,
          assessment: final,
        },
        true,
      ).status,
      409,
    );
    assert.equal(
      (
        store.handle(
          user,
          "other-app",
          { action: "load", patientId: "p" },
          true,
        ).body as ConsultationView
      ).assessments.length,
      0,
    );
    assert.ok(
      Object.values(
        (
          store.handle(user, "app", { action: "load", patientId: "p" }, true)
            .body as ConsultationView
        ).blank.values,
      ).every((v) => v === ""),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
