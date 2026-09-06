import { describe, expect, test } from "vitest";
import { CLASSIFICATIONS, isUrlSafe } from "./filter-policy.ts";
import { DATA_CLASSIFICATIONS, classificationFor } from "./data-classification.ts";

/**
 * The registry is read by two policies that answer different questions from the
 * same answer: may this appear in a URL, and must this be masked before a
 * provider sees it. These pin the table itself -- the policies have their own
 * tests -- because a key classified wrongly here is wrong in both of them.
 */

describe("the registry", () => {
  test("every entry carries a classification the union knows", () => {
    for (const [key, classification] of Object.entries(DATA_CLASSIFICATIONS)) {
      expect(CLASSIFICATIONS, key).toContain(classification);
    }
  });

  /* A key absent from the table is not an error, it is "unclassified" -- which
     is not url-safe and is masked before egress. The default has to be the
     careful one: a key nobody classified is the one least likely to have been
     thought about. */
  test("a key nobody classified resolves to unclassified", () => {
    expect(classificationFor("somethingBrandNew")).toBe("unclassified");
    expect(isUrlSafe({ classification: classificationFor("somethingBrandNew") })).toBe(false);
  });

  test("classificationFor agrees with the table", () => {
    expect(classificationFor("mrn")).toBe("phi");
    expect(classificationFor("status")).toBe("operational");
  });

  test("lookup is exact, not prefix or case insensitive", () => {
    /* Deliberate. A fuzzy lookup here would classify `statusReason` from
       `status` and quietly declare a field url-safe that nobody entered. */
    expect(classificationFor("MRN")).toBe("unclassified");
    expect(classificationFor("mrnPrefix")).toBe("unclassified");
  });
});

/**
 * The policy's own table, written out again rather than derived from the
 * registry. Asserting the registry against itself would pass however it was
 * edited; this fails when an entry is changed to something the policy does not
 * say.
 */
describe("the policy's table", () => {
  const stated: Record<string, string> = {
    patientName: "phi",
    mrn: "phi",
    dob: "phi",
    emiratesId: "pii",
    phone: "pii",
    email: "pii",
    memberId: "pii",
    insuranceId: "pii",
    diagnosis: "clinical",
    medication: "clinical",
    procedure: "clinical",
  };

  for (const [key, classification] of Object.entries(stated)) {
    test(`${key} is ${classification}`, () => {
      expect(DATA_CLASSIFICATIONS[key]).toBe(classification);
    });
  }

  test("none of them may be written to a URL", () => {
    for (const key of Object.keys(stated)) {
      expect(isUrlSafe({ classification: classificationFor(key) }), key).toBe(false);
    }
  });
});

describe("free text", () => {
  /* A box a user can type anything into is classified for what it can HOLD, not
     for what it is called. The search box on a clinical worklist is where a
     patient's name arrives by accident. */
  test("the search box and the ad-hoc fields beside it are phi", () => {
    expect(DATA_CLASSIFICATIONS.query).toBe("phi");
    expect(DATA_CLASSIFICATIONS.tags).toBe("phi");
    expect(DATA_CLASSIFICATIONS.recordRef).toBe("phi");
  });
});

/**
 * The clinical record fields the assistant reads. Named here because the AI
 * side has to distinguish an identifier from clinical CONTENT: masking a
 * diagnosis would empty out the use case that exists to reason about it, while
 * masking the name of the person it belongs to costs nothing.
 */
describe("the clinical record", () => {
  test("who and when are identifiers", () => {
    expect(DATA_CLASSIFICATIONS.dob).toBe("phi");
    expect(DATA_CLASSIFICATIONS.admitted).toBe("phi");
    expect(DATA_CLASSIFICATIONS.clinician).toBe("pii");
  });

  test("what is wrong with them is clinical, and stays legible", () => {
    for (const key of ["primaryDiagnosis", "problem", "complaint", "findings", "ward", "acuity"]) {
      expect(DATA_CLASSIFICATIONS[key], key).toBe("clinical");
    }
  });

  /* Clinical is not url-safe either. It is only the egress rule that treats it
     differently from phi, and only because the provider needs it to answer. */
  test("clinical content still may not be written to a URL", () => {
    expect(isUrlSafe({ classification: classificationFor("primaryDiagnosis") })).toBe(false);
  });
});

describe("what operational means", () => {
  test("nothing operational names a person", () => {
    for (const key of ["patientName", "clinician", "createdBy", "email", "phone"]) {
      expect(DATA_CLASSIFICATIONS[key], key).not.toBe("operational");
    }
  });

  test("the fields a worklist is filtered and paged by are operational", () => {
    for (const key of ["status", "branch", "department", "owner", "priority", "from", "to", "sort", "page", "pageSize"]) {
      expect(DATA_CLASSIFICATIONS[key], key).toBe("operational");
    }
  });
});
