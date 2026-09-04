/**
 * Redaction, applied during assembly rather than at dispatch.
 *
 * The ordering is the point. If redaction ran on the way out, the transparency
 * panel would show one thing and the provider would receive another — in the
 * user's favour, but still a panel that does not describe the request. Running
 * it here means the panel renders the redacted value because that IS the value.
 *
 * Deliberately conservative and dumb: name-based rules, no content sniffing. A
 * clever matcher that redacts by shape would eventually redact a customer name
 * that looks like an account number, and a user who sees their own data mangled
 * stops trusting the panel.
 */

export interface Redaction {
  value: string;
  redacted: boolean;
}

/** Matched against the FIELD KEY, lowercased. Order is not significant. */
const SENSITIVE = [
  { test: /email/, mask: maskEmail },
  { test: /phone|mobile|tel\b/, mask: maskTail },
  { test: /iban|account(number)?$|card/, mask: maskTail },
  { test: /policy|coverage|claim/, mask: maskTail },
  { test: /passport|emirates ?id|nationalid|ssn/, mask: maskAll },
  /* Clinical identifiers. Added with the healthcare module, having checked what
     this list did NOT cover before enabling anything there: a date of birth
     plus a ward and a diagnosis re-identifies a person in a small population,
     which is why dob is masked entirely rather than truncated. */
  { test: /^dob$|birth ?date|date ?of ?birth/, mask: maskAll },
  { test: /\bmrn\b|medical ?record ?(no|number)|patient ?(id|no)/, mask: maskTail },
];

function maskTail(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function maskAll(): string {
  return "••••••••";
}

function maskEmail(value: string): string {
  const at = value.indexOf("@");
  if (at <= 0) return maskTail(value);
  const name = value.slice(0, at);
  const head = name.slice(0, 1);
  return `${head}${"•".repeat(Math.max(2, name.length - 1))}${value.slice(at)}`;
}

export function redactField(key: string, value: string): Redaction {
  const lower = key.toLowerCase();
  for (const rule of SENSITIVE) {
    if (rule.test.test(lower)) return { value: rule.mask(value), redacted: true };
  }
  return { value, redacted: false };
}
