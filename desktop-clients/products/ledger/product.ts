import { defineProduct } from "@pepbits/erp-config";
export const product = defineProduct({
  id: "ledger", name: "LEDGER", tagline: "Finance workspace",
  defaultModule: "finance", enabledModules: ["finance"],
  enabledPages: ["customer-master"],
  pageTitles: {"customer-master":"Customers"},
  access: {
    actions: {
      create: ["enterprise-admin", "finance-manager"],
      edit: ["enterprise-admin", "finance-manager"],
      archive: ["enterprise-admin"],
      export: ["enterprise-admin", "finance-manager"],
    },
    pages: {"ai-administration":["enterprise-admin"]},
  },
});
