import "./globals.css";
import type { Metadata, Viewport } from "next";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "UK Salary Calculator · 2025/26",
  description:
    "Work out your take-home pay after Income Tax, National Insurance, pension and student loan deductions. UK tax year 2025/26.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && prefersDark)) document.documentElement.classList.add('dark');
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh font-sans">
        <header className="sticky top-0 z-20 border-b border-token bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <a href="/" className="group flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
                <PoundIcon />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-tight">Salary Calculator</span>
                <span className="text-[11px] text-ink-muted">UK · Tax year 2025/26</span>
              </span>
            </a>
            <div className="flex items-center gap-2">
              <span className="chip hidden sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-12 pt-6 text-xs text-ink-muted sm:px-6">
          <p>
            Estimates only — based on HMRC thresholds for tax year 2025/26 (UK rest of UK and Scottish bands). Tax codes,
            benefits in kind and other allowances may alter the result. Not financial advice.
          </p>
        </footer>
      </body>
    </html>
  );
}

function PoundIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 7c-.5-2-2-3-4-3-3 0-5 2-5 5v3H6" />
      <path d="M6 14h11" />
      <path d="M9 10v6c0 1.5-.7 2.5-2 3h12" />
    </svg>
  );
}
