"use client";

import React, { createContext, useContext } from "react";
import { NEXORA_PRODUCT, productForRole, type ProductDefinition, type LanguageKey } from "@pepbits/erp-config";

const LanguageLoaderContext = createContext<((language: LanguageKey) => Promise<void>) | undefined>(undefined);
export const useProductLanguageLoader = () => useContext(LanguageLoaderContext);

const ProductContext = createContext<ProductDefinition>(NEXORA_PRODUCT);

/** Mount outside navigation, ERPProvider and screens; keep the product identity stable
 * for the signed-in application. Catalog updates can rerender consumers without
 * replacing the provider or remounting workspace documents. */
export function ProductProvider({ product, role, children, loadLanguage }: { loadLanguage?: (language: LanguageKey) => Promise<void>; product: ProductDefinition; role?: string; children: React.ReactNode }) {
  const visible = React.useMemo(() => productForRole(product, role), [product, role]);
  return <LanguageLoaderContext.Provider value={loadLanguage}><ProductContext.Provider value={visible}>{children}</ProductContext.Provider></LanguageLoaderContext.Provider>;
}

export function useProduct(): ProductDefinition {
  return useContext(ProductContext);
}
