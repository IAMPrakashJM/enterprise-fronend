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
      <head>
        {/* Every family the font-family preference offers. display=swap so text
            paints in the fallback immediately and re-renders when the face lands,
            rather than staying invisible for the download. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@400;600;700;800&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;600;700;800&family=Nunito+Sans:wght@400;600;700;800&display=swap" />
      </head>
      <body><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
