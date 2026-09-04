/**
 * The dynamic consultation template.
 *
 * Four configuration layers — consultation type, specialty, complaint and
 * patient context — five options each, composed at render time. That is 625
 * combinations from ONE screen, and the number is the argument: 625 hand-built
 * pages would drift apart the first time a red flag changed, and the drift would
 * land on whichever of the 625 nobody opened.
 *
 * The layers are ADDITIVE and ordered. Core sections first, then the type's
 * lifecycle requirements, then specialty examination and instruments, then the
 * complaint's prompts and safety content, then the patient-context rules. A
 * later layer may add and may raise a requirement; it never silently removes
 * what an earlier one asked for, because a template that quietly drops a
 * required field is worse than one that asks for too much.
 *
 * Nothing here is clinical advice. The prompts are documentation scaffolding —
 * what a note of this shape usually records — and the scores are named with the
 * conditions under which they apply rather than presented as things to fill in.
 */

export interface ConsultationOption {
  id: string;
  label: string;
  summary: string;
}

export interface ExamGroup {
  title: string;
  findings: string[];
}

export interface ScoreOffer {
  name: string;
  /** WHEN it applies. Shown instead of a blank input, so an instrument is not
      filled in because it was on screen. */
  appliesWhen: string;
}

export interface ComposedConsultation {
  title: string;
  crumb: string;
  /** The layer that contributed each section, for the transparency the whole
      engine depends on: a clinician should be able to see why a field is here. */
  sections: Array<{ id: string; index: string; title: string; subtitle: string; source: string; required: boolean }>;
  prompts: string[];
  exam: { title: string; subtitle: string; groups: ExamGroup[] };
  scores: ScoreOffer[];
  problemLabel: string;
  contextNote: string;
  safetyNote: string;
  warnings: string[];
}

export const CONSULTATION_TYPES: ConsultationOption[] = [
  { id: "new", label: "New Consultation", summary: "Initial evaluation: baseline history, assessment, diagnosis and plan." },
  { id: "followup", label: "Follow-up", summary: "Interval history, response to treatment, adherence and change in status." },
  { id: "second", label: "Second Opinion", summary: "Prior records and opinion, the unresolved question, independent view." },
  { id: "procedure", label: "Procedure / Pre-op", summary: "Indication, readiness, consent status and peri-procedure plan." },
  { id: "transition", label: "Post-discharge Review", summary: "Transition of care: reconciliation, unresolved issues, safety net." },
];

export const SPECIALTIES: ConsultationOption[] = [
  { id: "cardiology", label: "Cardiology", summary: "Cardiac symptoms, risk factors, cardiovascular examination." },
  { id: "orthopaedics", label: "Orthopaedics", summary: "Mechanism, laterality, range of motion, neurovascular status." },
  { id: "paediatrics", label: "Paediatrics", summary: "Guardian source, growth, development, age-appropriate ranges." },
  { id: "psychiatry", label: "Psychiatry", summary: "Mental state, risk and safety, function, validated instruments." },
  { id: "obgyn", label: "Obstetrics & Gynaecology", summary: "Menstrual and obstetric context, maternal and fetal findings." },
];

export const CONDITIONS: ConsultationOption[] = [
  { id: "acute", label: "Acute Symptom", summary: "New presentation: red flags, onset, relevant negatives." },
  { id: "chronic", label: "Chronic Review", summary: "Control, interval events, treatment response, complications." },
  { id: "medication", label: "Medication Review", summary: "Exposure, adherence, response, side effects, interactions." },
  { id: "result", label: "Abnormal Result", summary: "Significance, trend, correlation, next investigation." },
  { id: "preventive", label: "Preventive Review", summary: "Risk factors, screening status, anticipatory guidance." },
];

export const PATIENT_CONTEXTS: ConsultationOption[] = [
  { id: "adult", label: "Adult", summary: "Standard adult context with age and sex rules where relevant." },
  { id: "paediatric", label: "Paediatric", summary: "Guardian source, weight-based safety, development, consent." },
  { id: "older", label: "Older Adult / Frailty", summary: "Falls, cognition, function, polypharmacy, caregiver, goals." },
  { id: "pregnancy", label: "Pregnancy / Postpartum", summary: "Gestational status, medication and imaging safety." },
  { id: "complex", label: "Complex Multimorbidity", summary: "Competing risks, reconciliation, care-team coordination." },
];

const TYPE_PROMPTS: Record<string, string[]> = {
  new: ["Baseline history", "Prior care and records", "Problem definition", "Initial treatment goals"],
  followup: ["Change since last visit", "Treatment response", "Adherence", "New symptoms or complications"],
  second: ["Prior diagnosis", "Prior recommendation", "Records reviewed", "Question requiring an opinion"],
  procedure: ["Indication", "Readiness", "Medication hold or review", "Consent and risk discussion"],
  transition: ["Discharge course", "Medication reconciliation", "Unresolved issues", "Follow-up ownership"],
};

interface SpecialtyPack {
  examTitle: string;
  examSubtitle: string;
  prompts: string[];
  groups: ExamGroup[];
  scores: ScoreOffer[];
  problems: Record<string, string>;
}

const SPECIALTY_PACKS: Record<string, SpecialtyPack> = {
  cardiology: {
    examTitle: "Cardiovascular examination",
    examSubtitle: "Cardiac and perfusion findings, linked to the presenting symptom",
    prompts: ["Exertional component", "Radiation", "Dyspnoea", "Palpitations", "Syncope or presyncope", "Orthopnoea", "Oedema", "Cardiac risk factors"],
    groups: [
      { title: "Cardiovascular", findings: ["Heart sounds", "Murmur or added sounds", "JVP", "Peripheral oedema"] },
      { title: "Perfusion", findings: ["Peripheral pulses", "Capillary refill", "Skin temperature", "Signs of congestion"] },
      { title: "Respiratory", findings: ["Air entry", "Crackles", "Work of breathing", "Oxygen requirement"] },
      { title: "Functional", findings: ["Exercise tolerance", "Symptom burden", "Recent weight change", "Functional limitation"] },
    ],
    scores: [
      { name: "Chest-pain risk instrument", appliesWhen: "Only where the presentation meets the instrument's intended use." },
      { name: "Heart-failure functional class", appliesWhen: "Where heart-failure symptom burden is being assessed." },
      { name: "Stroke and bleeding risk", appliesWhen: "Atrial fibrillation and anticoagulation decisions only." },
      { name: "Orthostatic assessment", appliesWhen: "Where syncope or hypotension is part of the presentation." },
    ],
    problems: { acute: "Chest pain, palpitations or dyspnoea", chronic: "Heart failure, hypertension or arrhythmia review", medication: "Anticoagulant or cardiac medication review", result: "Abnormal ECG, echo or troponin", preventive: "Cardiovascular risk assessment" },
  },
  orthopaedics: {
    examTitle: "Musculoskeletal examination",
    examSubtitle: "Laterality, function, range of motion, stability and neurovascular status",
    prompts: ["Mechanism of injury", "Site and laterality", "Weight-bearing ability", "Swelling", "Locking or giving way", "Neurological symptoms", "Functional limitation", "Prior injury or surgery"],
    groups: [
      { title: "Inspection", findings: ["Swelling or bruising", "Deformity", "Alignment", "Skin and wound"] },
      { title: "Palpation", findings: ["Tenderness", "Crepitus", "Temperature", "Effusion"] },
      { title: "Movement", findings: ["Active range", "Passive range", "Painful arc", "Strength"] },
      { title: "Neurovascular", findings: ["Sensation", "Motor power", "Distal pulses", "Capillary refill"] },
    ],
    scores: [
      { name: "Pain score", appliesWhen: "Using the patient-reported scale already in use." },
      { name: "Joint function instrument", appliesWhen: "Where a joint-specific instrument is configured." },
      { name: "Injury classification", appliesWhen: "Only once a diagnosis supports classification." },
      { name: "Falls risk", appliesWhen: "Older or frail patients, or where mobility is a concern." },
    ],
    problems: { acute: "Joint pain, injury or back pain", chronic: "Osteoarthritis or chronic musculoskeletal review", medication: "Analgesic or anti-inflammatory review", result: "Abnormal radiograph or MRI", preventive: "Bone health and mobility review" },
  },
  paediatrics: {
    examTitle: "Paediatric examination",
    examSubtitle: "Age-adjusted observation, growth, development and hydration",
    prompts: ["Source of history", "Feeding and intake", "Urine output", "Activity level", "Fever pattern", "Sick contacts", "Immunisation status", "Birth and development"],
    groups: [
      { title: "General", findings: ["Interaction and alertness", "Hydration", "Colour and perfusion", "Work of breathing"] },
      { title: "Growth", findings: ["Weight centile", "Height or length centile", "Head circumference", "Growth trajectory"] },
      { title: "Development", findings: ["Age-appropriate milestones", "School and function", "Behaviour", "Caregiver concerns"] },
      { title: "Systems", findings: ["ENT", "Respiratory", "Cardiovascular", "Abdomen and neurology"] },
    ],
    scores: [
      { name: "Early warning score", appliesWhen: "Where configured for this setting and age band." },
      { name: "Growth centile", appliesWhen: "Requires the correct age and sex reference dataset." },
      { name: "Pain scale", appliesWhen: "An age and development-appropriate instrument." },
      { name: "Dehydration severity", appliesWhen: "Condition-specific, where a validated tool is configured." },
    ],
    problems: { acute: "Fever, cough or acute presentation", chronic: "Asthma, growth or chronic condition review", medication: "Weight-based medication review", result: "Abnormal paediatric result", preventive: "Well-child and immunisation review" },
  },
  psychiatry: {
    examTitle: "Mental state examination",
    examSubtitle: "Structured mental state with risk and safety assessment",
    prompts: ["Mood change", "Anxiety", "Sleep", "Appetite", "Function", "Perceptual symptoms", "Substance use", "Safety concerns"],
    groups: [
      { title: "Appearance and behaviour", findings: ["Grooming", "Eye contact", "Psychomotor activity", "Engagement"] },
      { title: "Speech and mood", findings: ["Speech", "Reported mood", "Affect", "Congruence"] },
      { title: "Thought", findings: ["Form and process", "Content", "Perception", "Preoccupations"] },
      { title: "Cognition and safety", findings: ["Orientation", "Attention", "Insight and judgement", "Risk assessment"] },
    ],
    scores: [
      { name: "Depression instrument", appliesWhen: "Where screening or monitoring is clinically appropriate." },
      { name: "Anxiety instrument", appliesWhen: "Where anxiety assessment is clinically appropriate." },
      { name: "Risk assessment", appliesWhen: "Escalation follows policy, never a score alone." },
      { name: "Substance-use instrument", appliesWhen: "Using the validated tool configured for this service." },
    ],
    problems: { acute: "Acute mood, anxiety or behavioural concern", chronic: "Depression or anxiety follow-up", medication: "Psychotropic response and side-effect review", result: "Abnormal screening result", preventive: "Wellbeing and risk review" },
  },
  obgyn: {
    examTitle: "Obstetric and gynaecological examination",
    examSubtitle: "Menstrual and obstetric context with maternal and fetal findings",
    prompts: ["Last menstrual period", "Bleeding", "Pelvic pain", "Discharge", "Pregnancy status", "Fetal movement", "Contraception", "Obstetric history"],
    groups: [
      { title: "General and abdominal", findings: ["General status", "Abdominal tenderness", "Mass or distension", "Surgical scars"] },
      { title: "Gynaecological", findings: ["External examination if indicated", "Speculum if indicated", "Bimanual if indicated", "Consent and chaperone"] },
      { title: "Obstetric", findings: ["Gestational age", "Fundal height", "Fetal heart rate", "Fetal movement"] },
      { title: "Risk context", findings: ["Previous outcome", "Hypertensive or diabetic risk", "Medication exposure", "Warning signs"] },
    ],
    scores: [
      { name: "Obstetric risk assessment", appliesWhen: "Per the facility's configured protocol." },
      { name: "Perinatal mental health", appliesWhen: "Where a perinatal screening workflow is configured." },
      { name: "Thromboembolism risk", appliesWhen: "Per the applicable obstetric or postpartum protocol." },
      { name: "Bleeding severity", appliesWhen: "Presentation-specific assessment." },
    ],
    problems: { acute: "Pelvic pain, bleeding or pregnancy-related symptom", chronic: "Antenatal or gynaecological follow-up", medication: "Medication safety in pregnancy", result: "Abnormal ultrasound or screening result", preventive: "Reproductive and antenatal preventive review" },
  },
};

const CONTEXT_NOTES: Record<string, string> = {
  adult: "Adult context: age and sex rules apply only where clinically relevant.",
  paediatric: "Paediatric context: guardian as source, weight-based safety, age-specific ranges and consent rules apply.",
  older: "Older adult context: falls, cognition, function, polypharmacy, caregiver context and goals of care are surfaced.",
  pregnancy: "Pregnancy context: gestational status, maternal and fetal warning signs, and medication and imaging safety are surfaced.",
  complex: "Complex multimorbidity: problem reconciliation, competing risks, medication burden and care-plan ownership are prioritised.",
};

/**
 * Combinations the engine allows but flags.
 *
 * They are WARNINGS, not blocks. Adolescent gynaecology, a pregnant patient with
 * a fracture and a paediatric patient in a transition clinic are all real; a
 * template that refused them would be wrong more often than the clinician is.
 * What it can do is say why the pairing is unusual.
 */
export function contextWarnings(specialty: string, context: string): string[] {
  const warnings: string[] = [];
  if (specialty === "paediatrics" && context !== "paediatric") {
    warnings.push("Paediatrics with a non-paediatric patient context. Valid for adolescent and transition clinics; confirm the age ranges and permissions are right for this service.");
  }
  if (specialty !== "paediatrics" && context === "paediatric") {
    warnings.push("Paediatric context outside Paediatrics. The specialty must explicitly support paediatric practice, age ranges and consent handling.");
  }
  if (context === "pregnancy" && specialty === "orthopaedics") {
    warnings.push("Pregnancy with Orthopaedics: medication and imaging safety considerations apply. This is a prompt, not a reason to withhold clinically indicated care.");
  }
  if (context === "pregnancy" && specialty === "psychiatry") {
    warnings.push("Pregnancy with Psychiatry: perinatal mental-health pathways and medication-safety considerations apply.");
  }
  if (specialty === "obgyn" && context === "paediatric") {
    warnings.push("Obstetrics & Gynaecology with a paediatric context may be adolescent gynaecology. Age, consent and privacy rules for the jurisdiction apply.");
  }
  if (context === "complex" && specialty === "paediatrics") {
    warnings.push("Complex multimorbidity in Paediatrics usually implies a shared-care or long-term-conditions pathway rather than a single specialty plan.");
  }
  return warnings;
}

const label = (options: ConsultationOption[], id: string) => options.find((o) => o.id === id)?.label ?? id;

/** Core sections every consultation carries, whatever the four layers say. */
const CORE_SECTIONS = [
  { id: "overview", title: "Clinical overview", subtitle: "Encounter context and active alerts", source: "Core", required: false },
  { id: "hpi", title: "Presenting complaint and history", subtitle: "Structured prompts plus clinician narrative", source: "Core", required: true },
  { id: "history", title: "History, allergies and reconciliation", subtitle: "Longitudinal data reused rather than re-entered", source: "Core", required: false },
  { id: "vitals", title: "Vitals and measurements", subtitle: "Imported with provenance from validated observations", source: "Core", required: false },
];

export function composeConsultation(
  type: string, specialty: string, condition: string, context: string,
): ComposedConsultation {
  const pack = SPECIALTY_PACKS[specialty] ?? SPECIALTY_PACKS.cardiology;
  const typePrompts = TYPE_PROMPTS[type] ?? TYPE_PROMPTS.new;

  const sections = [
    ...CORE_SECTIONS,
    { id: "exam", title: pack.examTitle, subtitle: pack.examSubtitle, source: `Specialty · ${label(SPECIALTIES, specialty)}`, required: true },
    { id: "scores", title: "Clinical instruments", subtitle: "Offered with the conditions under which each applies", source: `Specialty · ${label(SPECIALTIES, specialty)}`, required: false },
    { id: "assessment", title: "Assessment and problems", subtitle: "Clinical reasoning and the problems addressed", source: `Complaint · ${label(CONDITIONS, condition)}`, required: true },
    { id: "plan", title: "Plan, education and follow-up", subtitle: "Actionable and traceable to each problem", source: "Core", required: true },
    ...(type === "procedure" ? [{ id: "consent", title: "Consent and readiness", subtitle: "Indication, risks discussed, and preparation", source: "Type · Procedure", required: true }] : []),
    ...(type === "transition" ? [{ id: "reconcile", title: "Transition reconciliation", subtitle: "Discharge course, medication changes and unresolved issues", source: "Type · Post-discharge", required: true }] : []),
    ...(context === "older" || context === "complex"
      ? [{ id: "function", title: "Function, frailty and caregiver", subtitle: "Added by the patient-context layer", source: `Context · ${label(PATIENT_CONTEXTS, context)}`, required: false }] : []),
    ...(context === "pregnancy" ? [{ id: "maternal", title: "Maternal and fetal considerations", subtitle: "Added by the patient-context layer", source: "Context · Pregnancy", required: true }] : []),
    ...(context === "paediatric" ? [{ id: "guardian", title: "Guardian, growth and safeguarding", subtitle: "Added by the patient-context layer", source: "Context · Paediatric", required: true }] : []),
    { id: "sign", title: "Review and sign", subtitle: "Signed notes are versioned; corrections are addenda", source: "Core", required: true },
  ].map((section, index) => ({ ...section, index: String(index + 1).padStart(2, "0") }));

  return {
    title: `${label(CONSULTATION_TYPES, type)} · ${label(SPECIALTIES, specialty)}`,
    crumb: `${label(CONDITIONS, condition)} → ${label(PATIENT_CONTEXTS, context)} → composed template`,
    sections,
    prompts: [...typePrompts, ...pack.prompts],
    exam: { title: pack.examTitle, subtitle: pack.examSubtitle, groups: pack.groups },
    scores: pack.scores,
    problemLabel: pack.problems[condition] ?? pack.problems.acute,
    contextNote: CONTEXT_NOTES[context] ?? CONTEXT_NOTES.adult,
    safetyNote: `Safety prompts for ${(pack.problems[condition] ?? "this presentation").toLowerCase()} come from governed decision-support content. Record only what was actually assessed.`,
    warnings: contextWarnings(specialty, context),
  };
}

/** 5 × 5 × 5 × 5. Stated so the count in the UI is derived, not typed. */
export const COMBINATION_COUNT =
  CONSULTATION_TYPES.length * SPECIALTIES.length * CONDITIONS.length * PATIENT_CONTEXTS.length;
