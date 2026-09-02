import type { ThemeKey } from "./types";

export const THEME_OPTIONS: Array<{
  id: ThemeKey;
  name: string;
  description: string;
  swatches: [string, string, string];
}> = [
  { id: "nexora", name: "Nexora Blue", description: "Bright enterprise workspace", swatches: ["#3156d9", "#0ea5a4", "#f4f7fb"] },
  { id: "midnight", name: "Midnight Ops", description: "Low-glare control room", swatches: ["#6d8cff", "#2dd4bf", "#070d18"] },
  { id: "emerald", name: "Emerald Ledger", description: "Calm finance-focused palette", swatches: ["#167a55", "#d97706", "#f2f8f5"] },
  { id: "sand", name: "Executive Sand", description: "Warm boardroom neutral", swatches: ["#8a5b28", "#416a75", "#f7f3ea"] },
  { id: "rose", name: "Rose Quartz", description: "Soft modern workspace", swatches: ["#ad3f6b", "#6b5bd2", "#fbf5f7"] },
  { id: "slate", name: "Industrial Slate", description: "Dense operations neutral", swatches: ["#3f566b", "#3d7b80", "#eef1f4"] },
  { id: "contrast", name: "High Contrast", description: "Maximum visual separation", swatches: ["#0037ff", "#007d42", "#ffffff"] },
];
