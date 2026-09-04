/**
 * Bounded catalogues for coding and ordering.
 *
 * THE ASSIST SELECTS FROM THESE. It does not generate codes. A model asked to
 * produce an ICD code will produce something that looks exactly like one, and a
 * plausible wrong code is worse than no suggestion: it survives review precisely
 * because it is well formed. So the candidates travel in the payload, the prompt
 * is told to choose only from them, and anything outside the list is a bug we
 * can see rather than a hallucination we cannot.
 *
 * The same argument covers orders. "Suggest an order" is an instruction to
 * invent; "choose from the orders this service can actually place" is not.
 *
 * These are demonstration catalogues, not a terminology service. A deployment
 * binds to a real ICD-10/SNOMED release and its own orderable catalogue, and
 * the shape here is what that binding has to fill.
 */

export interface CodeCandidate {
  code: string;
  term: string;
}

export interface OrderCandidate {
  code: string;
  name: string;
  kind: "laboratory" | "imaging" | "procedure" | "referral" | "medication";
}

const SHARED_CODES: CodeCandidate[] = [
  { code: "R69", term: "Illness, unspecified" },
  { code: "Z00.00", term: "General adult medical examination without abnormal findings" },
  { code: "Z09", term: "Encounter for follow-up examination after completed treatment" },
];

export const ICD_CANDIDATES: Record<string, CodeCandidate[]> = {
  cardiology: [
    { code: "I20.9", term: "Angina pectoris, unspecified" },
    { code: "I10", term: "Essential (primary) hypertension" },
    { code: "I48.91", term: "Unspecified atrial fibrillation" },
    { code: "I50.9", term: "Heart failure, unspecified" },
    { code: "R07.9", term: "Chest pain, unspecified" },
    { code: "R00.2", term: "Palpitations" },
    ...SHARED_CODES,
  ],
  orthopaedics: [
    { code: "M54.5", term: "Low back pain" },
    { code: "M25.561", term: "Pain in right knee" },
    { code: "M17.9", term: "Osteoarthritis of knee, unspecified" },
    { code: "S52.501A", term: "Fracture of lower end of right radius, initial encounter" },
    { code: "M75.100", term: "Rotator cuff tear or rupture, unspecified" },
    { code: "M79.671", term: "Pain in right foot" },
    ...SHARED_CODES,
  ],
  paediatrics: [
    { code: "J06.9", term: "Acute upper respiratory infection, unspecified" },
    { code: "R50.9", term: "Fever, unspecified" },
    { code: "J45.909", term: "Unspecified asthma, uncomplicated" },
    { code: "A09", term: "Infectious gastroenteritis and colitis, unspecified" },
    { code: "R62.51", term: "Failure to thrive (child)" },
    { code: "Z00.129", term: "Routine child health examination without abnormal findings" },
    ...SHARED_CODES,
  ],
  psychiatry: [
    { code: "F32.9", term: "Major depressive disorder, single episode, unspecified" },
    { code: "F41.1", term: "Generalized anxiety disorder" },
    { code: "F43.12", term: "Post-traumatic stress disorder, chronic" },
    { code: "F51.01", term: "Primary insomnia" },
    { code: "F10.20", term: "Alcohol dependence, uncomplicated" },
    ...SHARED_CODES,
  ],
  obgyn: [
    { code: "N92.0", term: "Excessive and frequent menstruation with regular cycle" },
    { code: "N94.6", term: "Dysmenorrhea, unspecified" },
    { code: "O26.90", term: "Pregnancy-related condition, unspecified, unspecified trimester" },
    { code: "Z34.90", term: "Encounter for supervision of normal pregnancy, unspecified" },
    { code: "N39.0", term: "Urinary tract infection, site not specified" },
    ...SHARED_CODES,
  ],
};

export const ORDER_CANDIDATES: Record<string, OrderCandidate[]> = {
  cardiology: [
    { code: "LAB-TROP", name: "Troponin", kind: "laboratory" },
    { code: "LAB-BNP", name: "BNP / NT-proBNP", kind: "laboratory" },
    { code: "LAB-LIPID", name: "Lipid profile", kind: "laboratory" },
    { code: "IMG-ECG", name: "12-lead ECG", kind: "imaging" },
    { code: "IMG-ECHO", name: "Transthoracic echocardiogram", kind: "imaging" },
    { code: "REF-CARD", name: "Cardiology referral", kind: "referral" },
  ],
  orthopaedics: [
    { code: "IMG-XR", name: "Plain radiograph of the affected part", kind: "imaging" },
    { code: "IMG-MRI", name: "MRI of the affected joint", kind: "imaging" },
    { code: "LAB-CRP", name: "CRP and ESR", kind: "laboratory" },
    { code: "PRC-ASP", name: "Joint aspiration", kind: "procedure" },
    { code: "REF-PHYS", name: "Physiotherapy referral", kind: "referral" },
    { code: "REF-ORTH", name: "Orthopaedic referral", kind: "referral" },
  ],
  paediatrics: [
    { code: "LAB-FBC", name: "Full blood count", kind: "laboratory" },
    { code: "LAB-CRP", name: "CRP", kind: "laboratory" },
    { code: "LAB-URINE", name: "Urine dipstick and culture", kind: "laboratory" },
    { code: "IMG-CXR", name: "Chest radiograph", kind: "imaging" },
    { code: "REF-PAED", name: "Paediatric referral", kind: "referral" },
  ],
  psychiatry: [
    { code: "LAB-TFT", name: "Thyroid function tests", kind: "laboratory" },
    { code: "LAB-B12", name: "B12 and folate", kind: "laboratory" },
    { code: "REF-PSY", name: "Psychology referral", kind: "referral" },
    { code: "REF-CRISIS", name: "Crisis team referral", kind: "referral" },
  ],
  obgyn: [
    { code: "LAB-HCG", name: "Serum beta-hCG", kind: "laboratory" },
    { code: "LAB-FBC", name: "Full blood count", kind: "laboratory" },
    { code: "IMG-USS", name: "Pelvic ultrasound", kind: "imaging" },
    { code: "LAB-SWAB", name: "High vaginal swab", kind: "laboratory" },
    { code: "REF-OBS", name: "Obstetric referral", kind: "referral" },
  ],
};

export const codesFor = (specialty: string): CodeCandidate[] => ICD_CANDIDATES[specialty] ?? SHARED_CODES;
export const ordersFor = (specialty: string): OrderCandidate[] => ORDER_CANDIDATES[specialty] ?? [];

/** The candidate list as it travels in the payload: the model chooses from this
    string and the reply is matched back against these codes. */
export const candidateLine = (items: Array<{ code: string; term?: string; name?: string }>) =>
  items.map((i) => `${i.code} ${i.term ?? i.name}`).join("; ");
