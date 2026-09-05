import { describe, expect, test } from "vitest";
import { documentKey, parseDocumentKey } from "./document-key.ts";

const base = { tenantId: "TENANT01", documentType: "PATIENT", entityId: "100" };

describe("documentKey", () => {
  test("is tenant, type and entity", () => {
    expect(documentKey(base)).toBe("TENANT01:PATIENT:100");
  });

  /* The framework document is explicit about this: one patient legitimately has
     several documents open at once — the 360 view, two encounters, a medication
     chart. Keying on the patient would collapse them into one and the second
     click would silently focus the wrong screen. */
  test("the same patient in different document types is different documents", () => {
    const p360 = documentKey({ tenantId: "T1", documentType: "PATIENT", entityId: "100" });
    const enc = documentKey({ tenantId: "T1", documentType: "ENCOUNTER", entityId: "5001" });
    const chart = documentKey({ tenantId: "T1", documentType: "MEDICATION_CHART", entityId: "5001" });
    expect(new Set([p360, enc, chart]).size).toBe(3);
  });

  test("two encounters of one patient are two documents", () => {
    expect(documentKey({ tenantId: "T1", documentType: "ENCOUNTER", entityId: "5001" }))
      .not.toBe(documentKey({ tenantId: "T1", documentType: "ENCOUNTER", entityId: "5002" }));
  });

  /* Case matters here or it doesn't at all. If "patient" and "PATIENT" produce
     different keys, one caller typing the type in lower case opens a second copy
     of a record that is already on screen, and the duplicate guard reports
     nothing wrong. */
  test("the document type is case-insensitive", () => {
    expect(documentKey({ ...base, documentType: "patient" })).toBe(documentKey(base));
  });

  /* Entity ids are NOT normalised: an ERP code is allowed to be case-sensitive,
     and folding it would merge two genuinely different records. */
  test("the entity id is left exactly as given", () => {
    expect(documentKey({ ...base, entityId: "ab1" })).not.toBe(documentKey({ ...base, entityId: "AB1" }));
  });

  /* Without this, a tenant whose id contains the separator can mint a key that
     parses as a different tenant's record — tenant "T1:PATIENT" with entity "9"
     and tenant "T1" with a patient called "PATIENT:9" produce the same string.
     Tenant isolation is decided by this function; it has to refuse. */
  test("refuses a separator inside any part", () => {
    expect(() => documentKey({ ...base, tenantId: "T1:PATIENT" })).toThrow(/separator|colon|:/i);
    expect(() => documentKey({ ...base, entityId: "5001:extra" })).toThrow(/separator|colon|:/i);
    expect(() => documentKey({ ...base, documentType: "A:B" })).toThrow(/separator|colon|:/i);
  });

  test("refuses an empty part", () => {
    expect(() => documentKey({ ...base, tenantId: "" })).toThrow();
    expect(() => documentKey({ ...base, entityId: "  " })).toThrow();
  });
});

describe("parseDocumentKey", () => {
  test("round-trips", () => {
    expect(parseDocumentKey(documentKey(base))).toEqual({ tenantId: "TENANT01", documentType: "PATIENT", entityId: "100" });
  });

  test("returns null for anything that is not a key", () => {
    expect(parseDocumentKey("TENANT01:PATIENT")).toBeNull();
    expect(parseDocumentKey("")).toBeNull();
    expect(parseDocumentKey("a:b:c:d")).toBeNull();
  });
});
