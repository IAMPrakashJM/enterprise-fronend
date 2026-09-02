import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora ERP Workspace",
  description: "Configurable enterprise ERP interface prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
