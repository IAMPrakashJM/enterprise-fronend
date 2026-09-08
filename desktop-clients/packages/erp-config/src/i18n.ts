import { UI_MESSAGES } from "./locale-messages.ts";
import type { LanguageKey } from "./types.ts";

export const LANGUAGE_OPTIONS: Array<{ value: LanguageKey; label: string; native: string; dir: "ltr" | "rtl" }> = [
  { value: "en", label: "English", native: "English", dir: "ltr" },
  { value: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { value: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
  { value: "ml", label: "Malayalam", native: "മലയാളം", dir: "ltr" },
];

const dictionaries: Record<LanguageKey, Record<string, string>> = {
  en: {
    search: "Search",
    new: "New",
    filters: "Filters",
    advancedFilters: "Advanced filters",
    reset: "Reset",
    apply: "Apply",
    save: "Save",
    edit: "Edit",
    view: "View",
    cancel: "Cancel",
    dashboard: "Dashboard",
    notifications: "Notifications",
    messages: "Messages",
    branch: "Branch",
    role: "Role",
    records: "records",
    preferences: "My Preferences",
    help: "Help",
  },
  ar: {
    search: "بحث",
    new: "جديد",
    filters: "عوامل التصفية",
    advancedFilters: "عوامل تصفية متقدمة",
    reset: "إعادة تعيين",
    apply: "تطبيق",
    save: "حفظ",
    edit: "تعديل",
    view: "عرض",
    cancel: "إلغاء",
    dashboard: "لوحة المعلومات",
    notifications: "الإشعارات",
    messages: "الرسائل",
    branch: "الفرع",
    role: "الدور",
    records: "سجلات",
    preferences: "تفضيلاتي",
    help: "مساعدة",
  },
  hi: {
    search: "खोजें",
    new: "नया",
    filters: "फ़िल्टर",
    advancedFilters: "उन्नत फ़िल्टर",
    reset: "रीसेट",
    apply: "लागू करें",
    save: "सहेजें",
    edit: "संपादित करें",
    view: "देखें",
    cancel: "रद्द करें",
    dashboard: "डैशबोर्ड",
    notifications: "सूचनाएँ",
    messages: "संदेश",
    branch: "शाखा",
    role: "भूमिका",
    records: "रिकॉर्ड",
    preferences: "मेरी प्राथमिकताएँ",
    help: "सहायता",
  },
  ml: {
    search: "തിരയുക",
    new: "പുതിയത്",
    filters: "ഫിൽട്ടറുകൾ",
    advancedFilters: "വിപുലമായ ഫിൽട്ടറുകൾ",
    reset: "പുനഃസജ്ജമാക്കുക",
    apply: "പ്രയോഗിക്കുക",
    save: "സംരക്ഷിക്കുക",
    edit: "തിരുത്തുക",
    view: "കാണുക",
    cancel: "റദ്ദാക്കുക",
    dashboard: "ഡാഷ്ബോർഡ്",
    notifications: "അറിയിപ്പുകൾ",
    messages: "സന്ദേശങ്ങൾ",
    branch: "ശാഖ",
    role: "റോൾ",
    records: "റെക്കോർഡുകൾ",
    preferences: "എന്റെ മുൻഗണനകൾ",
    help: "സഹായം",
  },
};

export const LANGUAGE_LOCALES:Record<LanguageKey,string>={en:'en-US',ar:'ar-AE',hi:'hi-IN',ml:'ml-IN'};
export type TranslationValues=Record<string,string|number>;
export type TranslationCatalog=Partial<Record<LanguageKey,Record<string,string>>>;
export function translate(language:LanguageKey,key:string,values:TranslationValues={},overrides?:TranslationCatalog):string {
 const locale=Object.hasOwn(LANGUAGE_LOCALES,language)?language:'en';
 const own=(catalog:Record<string,string>|undefined)=>catalog&&Object.hasOwn(catalog,key)&&typeof catalog[key]==='string'?catalog[key]:undefined;
 const message=own(overrides?.[locale])??own(UI_MESSAGES[locale])??own(dictionaries[locale])??own(overrides?.en)??own(UI_MESSAGES.en)??own(dictionaries.en)??key;
 return message.replace(/\{(\w+)\}/g,(match,name)=>Object.hasOwn(values,name)?String(values[name]):match);
}
export {UI_MESSAGES};
export {loadFallbackLanguage} from "./locale-messages.ts";

/** Resolve an API display descriptor without translating record values. Older
 * servers and unknown product keys retain their readable fallback text. */
export function localizeApiMessage(descriptor: unknown, fallback: string, t: (key: string, values?: TranslationValues) => string): string {
  if (!descriptor || typeof descriptor !== 'object') return t(fallback);
  const {messageKey, messageValues} = descriptor as {messageKey?:unknown; messageValues?:unknown};
  if (typeof messageKey !== 'string' || !messageKey || !messageValues || typeof messageValues !== 'object' || Array.isArray(messageValues)) return t(fallback);
  if (Object.values(messageValues).some(value => typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value)))) return t(fallback);
  const result = t(messageKey, messageValues as TranslationValues);
  return result === messageKey ? t(fallback) : result;
}

/** Translate known validator messages at the UI boundary; unknown service errors
 * stay intact so product adapters can supply their own catalog entries. */
export function localizeFieldError(error: string | undefined, label: string, t: (message: string, values?: TranslationValues) => string): string | undefined {
  if (!error) return error;
  for (const suffix of [' cannot be empty.', ' must be a number.', ' cannot be negative.']) {
    if (error === label + suffix) return t('{field}' + suffix, {field:t(label)});
  }
  for (const suffix of [' is required', ' must be a number']) {
    if (error === label + suffix) return t('{field}' + suffix, {field: t(label)});
  }
  for (const suffix of [' must be at least ', ' must be at most ']) {
    if (error.startsWith(label + suffix)) return t('{field}' + suffix + '{value}', {field:t(label),value:error.slice((label + suffix).length)});
  }
  return t(error);
}

/** Structured presentation of legacy CSV parser errors; cell contents are never translated. */
export function localizeImportError(error: string, t: (message: string, values?: TranslationValues) => string): string {
  const row = /^Data row (\d+) has (\d+) cells; expected (\d+)\.$/.exec(error);
  return row ? t('Data row {row} has {actual} cells; expected {expected}.', {row:row[1],actual:row[2],expected:row[3]}) : t(error);
}

/** Stage names are administrator-entered data. Translate the notice, not its name. */
export function localizeApprovalNotice(message: string, t: (message: string, values?: TranslationValues) => string): string {
  for (const prefix of ['Submitted for ', 'Advanced to ']) {
    if (message.startsWith(prefix)) return t(prefix + '{stage}', {stage:message.slice(prefix.length)});
  }
  return t(message);
}
