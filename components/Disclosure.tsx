"use client";

import { useState, type ReactNode } from "react";

export default function Disclosure({
  title,
  hint,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  badge?: string | number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-token bg-[color:var(--bg-soft)] shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left transition hover:bg-[color:var(--bg)]"
      >
        <span className="flex flex-1 flex-col">
          <span className="flex items-center gap-2 text-sm font-semibold">
            {title}
            {badge ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                {badge}
              </span>
            ) : null}
          </span>
          {hint && <span className="text-xs text-ink-muted">{hint}</span>}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="border-t border-token p-5">{children}</div>}
    </div>
  );
}
