"use client";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {authedFetch, readToken, useSession} from "@pepbits/auth";
import {ProductProvider} from "@pepbits/erp-shell";
import {ProductServicesProvider} from "@pepbits/erp-screens";
import {sanitizePreferences, parseNavigation, parseLocalization, applyApplicationConfig,
  type LanguageKey, type LocalizationResponse, type NavigationResponse, type ProductDefinition} from "@pepbits/erp-config";
import {product, services} from "./active";

/** Load only the preferred language (the response includes English fallback).
 * Later switches load before committing the preference, without unmounting pages. */
export function ApplicationProductProvider({children}: {children: React.ReactNode}) {
  const {user} = useSession();
  const token = readToken();
  const identity = user ? JSON.stringify([user.tenantId,user.id,user.role,token,product.id]) : "";
  const identityRef = useRef(identity); identityRef.current = identity;
  const cache = useRef({identity, locales: new Map<LanguageKey, LocalizationResponse>(), pending: new Map<LanguageKey, Promise<void>>()});
  if (cache.current.identity !== identity) cache.current = {identity, locales: new Map(), pending: new Map()};
  const [attempt, retry] = useState(0);
  const [state, setState] = useState<{identity: string; product?: ProductDefinition; navigation?: NavigationResponse; error?: string}>({identity:""});
  useEffect(() => {
    if (!identity) return;
    const controller = new AbortController(); let active = true;
    const request = services.request ?? authedFetch;
    const read = async (path: string) => {
      const response = await request(path, {signal:controller.signal, headers:{"X-Product-Id":product.id}});
      if (!response.ok) throw new Error(`Application configuration could not be loaded (${response.status}).`);
      return response.json();
    };
    setState({identity});
    void Promise.all([
      read(`/navigation?productId=${encodeURIComponent(product.id)}`).then(value => parseNavigation(value, product.id)),
      read('/preferences').catch(() => ({})).then(value => sanitizePreferences(value.preferences).language).then(async language =>
        parseLocalization(await read(`/localization?productId=${encodeURIComponent(product.id)}&language=${language}`), product.id, language)),
    ]).then(([navigation, locale]) => {
      if (!active || identityRef.current !== identity || readToken() !== token) return;
      cache.current.locales.set(locale.language, locale);
      setState({identity, navigation, product:applyApplicationConfig(product, navigation, [locale])});
    }).catch(error => {if (active) setState({identity, error:error.message});});
    return () => {active = false; controller.abort();};
  }, [identity, attempt, token]);

  const loadLanguage = useCallback(async (language: LanguageKey) => {
    if (identityRef.current !== identity || readToken() !== token || !state.navigation) throw new Error('Session ended.');
    if (cache.current.locales.has(language)) return;
    const currentCache = cache.current;
    if (!currentCache.pending.has(language)) {
      currentCache.pending.set(language, (async () => {
        const response = await (services.request ?? authedFetch)(`/localization?productId=${encodeURIComponent(product.id)}&language=${language}`);
        if (!response.ok) throw new Error(`Application configuration could not be loaded (${response.status}).`);
        const locale = parseLocalization(await response.json(), product.id, language);
        if (identityRef.current !== identity || readToken() !== token) throw new Error('Session ended.');
        currentCache.locales.set(language, locale);
        setState(previous => previous.identity === identity ? {...previous, product:applyApplicationConfig(product, state.navigation!, [...currentCache.locales.values()])} : previous);
      })().finally(() => currentCache.pending.delete(language)));
    }
    await currentCache.pending.get(language);
  }, [identity, state.navigation, token]);

  if (user && (state.identity !== identity || !state.product)) return <main className="grid min-h-dvh place-items-center bg-[var(--bg)] p-6 text-[var(--text)]"><div role={state.identity === identity && state.error ? 'alert' : 'status'} className="space-y-3 text-center"><p>{state.identity === identity && state.error ? state.error : 'Loading application menus and languages…'}</p>{state.identity === identity && state.error ? <button type="button" className="rounded border px-4 py-2" onClick={() => retry(value => value + 1)}>Retry loading application</button> : null}</div></main>;
  return <ProductProvider preferenceRequest={services.request} product={user ? state.product! : product} role={user?.role} loadLanguage={user ? loadLanguage : undefined}>
    <ProductServicesProvider services={services}>{children}</ProductServicesProvider>
  </ProductProvider>;
}
