import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AutoApply — Job Application Automation Platform',
  description: 'AI-powered job application matching, resume tailoring, and automation platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-drafting-gray text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
