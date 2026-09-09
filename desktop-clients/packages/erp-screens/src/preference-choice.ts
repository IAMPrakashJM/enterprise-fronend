"use client";
import { useEffect, useState } from "react";
import type { PreferenceKey, PreferencePolicy, UserPreferences } from "@pepbits/erp-config";
export interface PreferenceHost {
  preferences: UserPreferences;
  preferencePolicy?: PreferencePolicy;
  preferencesAvailable?: boolean;
  onPreferenceChange?: <K extends PreferenceKey>(key: K, value: UserPreferences[K]) => void;
}
/** Local demos remain usable outside ERP; managed values always win, including
 * when a policy changes while a page is open. Hosts may persist unlocked edits.
 */
export function usePreferenceChoice<K extends PreferenceKey>(host: PreferenceHost, key: K) {
  const rule = host.preferencePolicy?.rules[key];
  const source = (rule?.locked ? rule.value : host.preferences[key]) as UserPreferences[K];
  const locked = host.preferencesAvailable === false || host.preferencePolicy?.rules[key]?.locked === true;
  const [choice, setChoice] = useState({ source, value: source });
  useEffect(() => setChoice({ source, value: source }), [source, locked]);
  const value = locked || choice.source !== source ? source : choice.value;
  const change = (next: UserPreferences[K]) => {
    if (locked) return;
    setChoice({ source, value: next });
    host.onPreferenceChange?.(key, next);
  };
  return [value, change, locked] as const;
}
