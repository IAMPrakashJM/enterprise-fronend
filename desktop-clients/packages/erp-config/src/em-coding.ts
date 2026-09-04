/**
 * Evaluation & Management level support (office / outpatient).
 *
 * WHAT THIS IS FOR. Since the 2021 revision, an office or outpatient E/M level
 * is selected by EITHER medical decision making OR total time on the date of the
 * encounter — not by counting history and examination bullets. History and exam
 * are performed and documented as medically appropriate. This module derives a
 * SUPPORTED level from the elements a clinician has already recorded, so the
 * note explains its own level.
 *
 * WHAT IT IS NOT FOR. It is not a target. A level is supported by the work that
 * was clinically necessary and actually done; raising an element to reach a code
 * is the failure this panel makes easier to spot rather than easier to commit,
 * which is why it always shows WHICH elements carried the level and never
 * suggests changing one.
 *
 * JURISDICTION. E/M levels and CPT codes are a US construct. This tenant is
 * configured for the UAE, where they do not apply, so the panel is behind a
 * tenant coding scheme and off unless a deployment selects it. Encoding a US
 * billing model as though it were universal is the kind of default that quietly
 * becomes wrong in another market.
 *
 * Codes here are the standard office/outpatient set. 99201 is absent because it
 * was deleted in the 2021 revision; a table still carrying it is a table that
 * has not been reviewed since.
 */

export type EmElementLevel = "straightforward" | "low" | "moderate" | "high";
export type EmPatientType = "new" | "established";
export type CodingScheme = "none" | "em";

export const EM_LEVELS: EmElementLevel[] = ["straightforward", "low", "moderate", "high"];

const RANK: Record<EmElementLevel, number> = { straightforward: 1, low: 2, moderate: 3, high: 4 };

export const EM_ELEMENTS: Array<{ id: "problems" | "data" | "risk"; label: string; hint: string; options: Array<{ value: EmElementLevel; label: string }> }> = [
  {
    id: "problems",
    label: "Problems addressed",
    hint: "Number and complexity of problems addressed AT THIS ENCOUNTER — not everything on the problem list.",
    options: [
      { value: "straightforward", label: "One self-limited or minor problem" },
      { value: "low", label: "Two or more self-limited; or one stable chronic; or one acute uncomplicated" },
      { value: "moderate", label: "One or more chronic with exacerbation; or two or more stable chronic; or an undiagnosed new problem with uncertain prognosis" },
      { value: "high", label: "One or more chronic with severe exacerbation; or one acute or chronic illness posing a threat to life or bodily function" },
    ],
  },
  {
    id: "data",
    label: "Data reviewed and analysed",
    hint: "Tests, documents, independent historian, independent interpretation, discussion with an external professional.",
    options: [
      { value: "straightforward", label: "Minimal or none" },
      { value: "low", label: "Limited — one category met" },
      { value: "moderate", label: "Moderate — one of three categories met" },
      { value: "high", label: "Extensive — two of three categories met" },
    ],
  },
  {
    id: "risk",
    label: "Risk of complications or morbidity",
    hint: "Risk of patient MANAGEMENT decisions made at the encounter, including options considered and not selected.",
    options: [
      { value: "straightforward", label: "Minimal risk" },
      { value: "low", label: "Low risk" },
      { value: "moderate", label: "Moderate — e.g. prescription drug management; decision regarding minor surgery with risk factors" },
      { value: "high", label: "High — e.g. drug therapy requiring intensive monitoring for toxicity; decision regarding hospitalisation" },
    ],
  },
];

const CODES: Record<EmPatientType, Record<EmElementLevel, string>> = {
  new: { straightforward: "99202", low: "99203", moderate: "99204", high: "99205" },
  established: { straightforward: "99212", low: "99213", moderate: "99214", high: "99215" },
};

/** Total time on the date of the encounter, in minutes, as ranges per level. */
const TIME_BANDS: Record<EmPatientType, Array<{ level: EmElementLevel; min: number; max: number }>> = {
  new: [
    { level: "straightforward", min: 15, max: 29 },
    { level: "low", min: 30, max: 44 },
    { level: "moderate", min: 45, max: 59 },
    { level: "high", min: 60, max: 74 },
  ],
  established: [
    { level: "straightforward", min: 10, max: 19 },
    { level: "low", min: 20, max: 29 },
    { level: "moderate", min: 30, max: 39 },
    { level: "high", min: 40, max: 54 },
  ],
};

export interface EmDerivation {
  level: EmElementLevel;
  code: string;
  /** The elements that met or exceeded the derived level — the note's own
      justification, and the reason this is support rather than a suggestion. */
  carriedBy: string[];
  basis: "mdm" | "time";
  explanation: string;
}

/**
 * Two of three. The level is the one met or exceeded by at least two elements,
 * which is the SECOND HIGHEST once sorted — not the average and not the maximum.
 *
 * Both wrong answers are plausible enough to be worth naming: the maximum lets a
 * single high element carry a visit on its own, and an average can land between
 * levels and invite rounding. The median of three is the rule as written.
 */
export function deriveFromMdm(
  problems: EmElementLevel, data: EmElementLevel, risk: EmElementLevel, patientType: EmPatientType,
): EmDerivation {
  const named: Array<[string, EmElementLevel]> = [["Problems", problems], ["Data", data], ["Risk", risk]];
  const sorted = [...named].sort((a, b) => RANK[b[1]] - RANK[a[1]]);
  const level = sorted[1][1];
  const carriedBy = named.filter(([, l]) => RANK[l] >= RANK[level]).map(([n]) => n);
  return {
    level,
    code: CODES[patientType][level],
    carriedBy,
    basis: "mdm",
    explanation: `${carriedBy.join(" and ")} met or exceeded ${level}. Two of the three elements determine the level.`,
  };
}

/** Null below the lowest band: time under the threshold does not support a
    level, and inventing one from it is the thing to avoid. */
export function deriveFromTime(minutes: number, patientType: EmPatientType): EmDerivation | null {
  const bands = TIME_BANDS[patientType];
  if (!Number.isFinite(minutes) || minutes < bands[0].min) return null;
  const band = bands.find((b) => minutes >= b.min && minutes <= b.max) ?? bands[bands.length - 1];
  return {
    level: band.level,
    code: CODES[patientType][band.level],
    carriedBy: ["Total time"],
    basis: "time",
    explanation: `${minutes} minutes falls in the ${band.min}–${band.max} band for a ${patientType} patient. Time and MDM are alternatives; only one is used.`,
  };
}

export function timeBandsFor(patientType: EmPatientType) {
  return TIME_BANDS[patientType].map((b) => ({ ...b, code: CODES[patientType][b.level] }));
}
