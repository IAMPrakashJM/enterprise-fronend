/**
 * The assembled payload: what is shown to the user, what is sent, and what is
 * stored as the audit body. One object for all three (spec D3, D10) — three
 * shapes would drift, and the one the user was shown is the one that matters in
 * a review.
 */

export interface AiContextField {
  /** Human label, as the transparency panel prints it. */
  label: string;
  /** The value AFTER redaction. There is no "original" alongside it: the panel
      must show what leaves the browser, not a cleaner version of it. */
  value: string;
  /** Which page element it came from, so a user can find it on screen. */
  source: string;
  /** True when a redaction rule changed the value. */
  redacted?: boolean;
}

export interface AiContext {
  useCaseId: string;
  pageId: string;
  capturedAt: string;
  fields: AiContextField[];
  /** Anything the user typed. Never redacted — they wrote it, they can see it,
      and silently altering it would make the panel a lie. */
  userInput?: string;
}
