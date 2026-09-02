import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/platform/providers";

export const metadata: Metadata = {
  title: "Nexora ERP Workspace",
  description: "Configurable enterprise ERP interface prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
