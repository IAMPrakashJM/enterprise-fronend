import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Vantage ERP', description: 'Halcyon Group · enterprise resource planning' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><link rel="preconnect" href="https://fonts.googleapis.com" /><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&family=Nunito+Sans:wght@400;600&display=swap" rel="stylesheet" /></head>
      <body>{children}</body>
    </html>
  );
}
