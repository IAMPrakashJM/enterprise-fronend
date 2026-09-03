'use client';
import { ERP } from '@/lib/mock';
import { usePrefsStore } from '@/lib/prefs/store';
export function useT() {
  const lang = usePrefsStore(s => s.prefs.lang);
  const dict = ERP.i18n[lang] ?? ERP.i18n.en;
  return (key: string) => dict[key] ?? ERP.i18n.en[key] ?? key;
}
