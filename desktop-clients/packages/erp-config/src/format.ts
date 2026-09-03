import type { DataColumn, UserPreferences } from "./types";

/* Value formatting lives HERE, not in ops-ui, for one reason: it has to read
   preferences, and ops-ui depends on nothing by design -- that is what keeps it
   a generic interaction surface rather than an ERP-specific one.
   ops-ui's formatCurrency stays where it is, hardcoded to AED, for any caller
   that has no preferences to consult. Every ERP screen uses this instead. */

export interface Formatters {
  money(value: number): string;
  /** A clock time. Accepts "HH:MM[:SS]" or the time half of an ISO string.
      `seconds` appends them in whichever of 12h/24h is configured. */
  time(value: string | Date, options?: { seconds?: boolean }): string;
  /** Date and time together, each in its own configured format. */
  dateTime(value: string | Date): string;
  compact(value: number): string;
  number(value: number): string;
  percent(value: number | string): string;
  date(value: string | Date): string;
  /** Format by the column's declared type. The single entry point for a cell. */
  cell(column: DataColumn | undefined, value: unknown): string;
}

type FormatPrefs = Pick<UserPreferences,
  "currencyCode" | "numberLocale" | "dateFormat" | "decimalPlaces"
  | "timeFormat" | "currencyDisplay" | "negativeStyle">;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Parsed by hand rather than with `new Date(value)`: the mock data is plain
   YYYY-MM-DD, and Date would read that as UTC midnight and then render it in
   the viewer's local zone -- which shifts every date back a day for anyone west
   of Greenwich. A calendar date has no timezone; treat it as three numbers. */
function parseDate(value: string): { y: string; m: string; d: string; month: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { y: match[1], m: match[2], d: match[3], month };
}

export function createFormatters(preferences: FormatPrefs): Formatters {
  const { currencyCode, numberLocale, dateFormat, decimalPlaces,
          timeFormat, currencyDisplay, negativeStyle } = preferences;

  /* currencySign:"accounting" is what produces (1,200) rather than -1,200 --
     done by Intl rather than by hand so the parenthesis lands where each locale
     puts it relative to the symbol, which is not the same everywhere. */
  const accounting = negativeStyle === "parentheses";
  const money = currencyDisplay === "none"
    ? new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
        signDisplay: accounting ? "never" : "auto",
      })
    : new Intl.NumberFormat(numberLocale, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: currencyDisplay === "code" ? "code" : "symbol",
        currencySign: accounting ? "accounting" : "standard",
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      });

  /* Only for the paths Intl does NOT parenthesise itself. currencySign:
     "accounting" already yields (AED 1,200); wrapping that too produced
     ((AED 1,200)). signDisplay:"never" strips the minus first, or this would
     read (-1,200). */
  const wrapNegative = (formatted: string, value: number) =>
    accounting && value < 0 ? `(${formatted})` : formatted;

  /* currencyDisplay:"none" drops to the plain decimal formatter, which has no
     currencySign option -- so that path, and only that path, needs the wrapper. */
  const currencyless = currencyDisplay === "none";
  const formatMoney = (value: number) =>
    currencyless ? wrapNegative(money.format(value), value) : money.format(value);
  const plain = new Intl.NumberFormat(numberLocale, { maximumFractionDigits: decimalPlaces, signDisplay: accounting ? "never" : "auto" });
  const compact = new Intl.NumberFormat(numberLocale, { notation: "compact", maximumFractionDigits: 1 });

  /* A Date is reduced to its LOCAL calendar parts, never via toISOString():
     that converts to UTC first, so any local time before the offset rolls the
     date back a day for anyone east of Greenwich -- Dubai included. */
  const isoOf = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

  const date = (value: string | Date): string => {
    if (value instanceof Date) value = isoOf(value);
    const parts = parseDate(value);
    if (!parts) return value;                       // not a date; leave it alone
    switch (dateFormat) {
      case "dmy":    return `${parts.d}/${parts.m}/${parts.y}`;
      case "mdy":    return `${parts.m}/${parts.d}/${parts.y}`;
      case "medium": return `${parts.d} ${MONTHS[parts.month - 1]} ${parts.y}`;
      default:       return `${parts.y}-${parts.m}-${parts.d}`;
    }
  };

  /* Read off the string rather than through Date, for the same reason dates are:
     "14:30" has no timezone, and routing it through Date would anchor it to
     today in UTC and then shift it by the viewer's offset. */
  const time = (value: string | Date, options?: { seconds?: boolean }): string => {
    let h: number;
    let m: string;
    let sec: string | null = null;
    if (value instanceof Date) {
      h = value.getHours();
      m = String(value.getMinutes()).padStart(2, "0");
      sec = String(value.getSeconds()).padStart(2, "0");
    } else {
      const match = /(?:^|[T\s])(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value);
      if (!match) return String(value);
      h = Number(match[1]);
      m = match[2];
      sec = match[3] ?? null;
      if (h > 23) return String(value);
    }
    /* Seconds appear only when the caller asks AND the source had them -- a
       "14:30" string must not gain a fabricated ":00". */
    const tail = options?.seconds && sec !== null ? `:${sec}` : "";
    if (timeFormat === "24h") return `${String(h).padStart(2, "0")}:${m}${tail}`;
    // 00:xx is 12 AM and 12:xx is 12 PM -- the two cases a plain h % 12 gets wrong.
    const suffix = h < 12 ? "AM" : "PM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m}${tail} ${suffix}`;
  };

  const percent = (value: number | string) => `${plain.format(Number(value))}%`;

  const dateTime = (value: string | Date): string => {
    if (value instanceof Date) return `${date(value)} ${time(value)}`;
    const stamp = time(value);
    const day = date(value);
    return stamp === value ? day : `${day} ${stamp}`;
  };

  return {
    money: (value) => formatMoney(Number(value) || 0),
    compact: (value) => compact.format(Number(value) || 0),
    number: (value) => wrapNegative(plain.format(Number(value) || 0), Number(value) || 0),
    percent,
    date,
    time,
    dateTime,
    cell(column, value) {
      if (value === null || value === undefined || value === "") return "—";
      switch (column?.type) {
        case "money":   return formatMoney(Number(value) || 0);
        case "percent": return percent(value as number);
        case "number":  return wrapNegative(plain.format(Number(value) || 0), Number(value) || 0);
        case "date":    return /[T\s]\d{1,2}:\d{2}/.test(String(value)) ? dateTime(String(value)) : date(String(value));
        default:
          /* An untyped column can still hold a date -- getWorklistConfig only
             tags some of them -- so a bare YYYY-MM-DD is formatted anyway.
             parseDate returns null for anything else, which passes through. */
          if (typeof value === "string" && parseDate(value)) return date(value);
          return String(value);
      }
    },
  };
}
