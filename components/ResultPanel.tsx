"use client";

import type { Breakdown, CalculatorInput, Frequency } from "@/lib/tax";
import BreakdownBar from "./BreakdownBar";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  yearly: "Year",
  monthly: "Month",
  weekly: "Week",
  daily: "Day",
  hourly: "Hour",
};

interface Row {
  label: string;
  amount: number;
  sign: "+" | "-";
  tone: string;
  sub?: string;
}

export default function ResultPanel({
  input,
  result,
  view,
  onViewChange,
  inFrequency,
}: {
  input: CalculatorInput;
  result: Breakdown;
  view: Frequency;
  onViewChange: (f: Frequency) => void;
  inFrequency: (annualAmount: number) => number;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: view === "hourly" || view === "daily" ? 2 : 0,
      minimumFractionDigits: view === "hourly" || view === "daily" ? 2 : 0,
    }).format(n);

  const fmtPrecise = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(n);

  const totalGross = result.gross + result.secondJob;

  const rows: Row[] = [
    {
      label: "Gross pay",
      amount: totalGross,
      sign: "+",
      tone: "text-ink",
      sub: grossSub(result),
    },
  ];
  if (result.taxableBenefits > 0) {
    rows.push({
      label: "Taxable benefits (BIK)",
      amount: result.taxableBenefits,
      sign: "+",
      tone: "text-ink-muted",
      sub: "Phantom income — taxed but no cash received",
    });
  }
  rows.push(
    { label: "Income Tax", amount: result.incomeTax, sign: "-", tone: "text-danger" },
    { label: "National Insurance", amount: result.nationalInsurance, sign: "-", tone: "text-danger" },
  );
  if (result.pension > 0) {
    rows.push({
      label: "Pension",
      amount: result.pension,
      sign: "-",
      tone: "text-warning",
      sub: pensionSub(input, result),
    });
  }
  if (result.childcareVouchers > 0) {
    rows.push({
      label: "Childcare vouchers",
      amount: result.childcareVouchers,
      sign: "-",
      tone: "text-warning",
    });
  }
  if (result.studentLoan > 0) {
    rows.push({
      label: "Student loan",
      amount: result.studentLoan,
      sign: "-",
      tone: "text-warning",
    });
  }

  return (
    <div className="space-y-6">
      <div className="card animate-fade-in overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Take-home per {FREQUENCY_LABELS[view].toLowerCase()}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
              {fmt(inFrequency(result.takeHome))}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              From {fmt(inFrequency(totalGross))} gross ·{" "}
              <span className="font-medium text-ink-soft">
                {(((result.takeHome / Math.max(1, totalGross)) * 100) || 0).toFixed(1)}% kept
              </span>
            </p>
          </div>
          <div className="segmented max-w-full sm:w-auto">
            {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
              <button
                key={f}
                type="button"
                data-active={view === f}
                onClick={() => onViewChange(f)}
              >
                {FREQUENCY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <BreakdownBar
            segments={[
              { label: "Take-home", value: result.takeHome, color: "bg-brand-500" },
              { label: "Income Tax", value: result.incomeTax, color: "bg-rose-500" },
              { label: "NI", value: result.nationalInsurance, color: "bg-amber-500" },
              { label: "Pension", value: result.pension, color: "bg-emerald-500" },
              { label: "Childcare", value: result.childcareVouchers, color: "bg-teal-500" },
              { label: "Student loan", value: result.studentLoan, color: "bg-violet-500" },
            ]}
          />
        </div>

        <ul className="mt-5 divide-y divide-[color:var(--border)]">
          {rows.map((r) => (
            <li key={r.label} className="flex items-start justify-between gap-3 py-2.5">
              <span className="flex flex-col">
                <span className="text-sm text-ink-soft">{r.label}</span>
                {r.sub && <span className="text-xs text-ink-muted">{r.sub}</span>}
              </span>
              <span className={`text-sm font-semibold tabular-nums ${r.tone}`}>
                {r.sign === "-" && r.amount > 0 ? "− " : ""}
                {fmt(inFrequency(r.amount))}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between pt-3">
            <span className="text-sm font-semibold">Take-home</span>
            <span className="text-base font-bold tabular-nums text-success">
              {fmt(inFrequency(result.takeHome))}
            </span>
          </li>
        </ul>

        {result.pensionExtraRelief > 0 && (
          <p className="mt-4 rounded-lg border border-token bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <strong>{fmtPrecise(result.pensionExtraRelief)}/yr</strong> reclaimable via Self-Assessment —
            higher / additional-rate relief on your RAS pension contribution.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Effective tax + NI"
          value={`${(result.effectiveTaxRate * 100).toFixed(1)}%`}
          hint="Total deductions ÷ gross"
        />
        <StatCard
          label="Marginal rate"
          value={`${(result.marginalRate * 100).toFixed(0)}%`}
          hint="On your next £1 earned"
        />
        <StatCard
          label="Personal allowance"
          value={fmtPrecise(result.personalAllowance)}
          hint={input.taxCode ? `Tax code ${input.taxCode.toUpperCase()}` : ""}
        />
      </div>

      {hasGrossBreakdown(result) && (
        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Gross income breakdown
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm">
            <Line label="Base salary" value={fmtPrecise(result.baseSalary)} />
            {result.overtime > 0 && <Line label="Overtime" value={fmtPrecise(result.overtime)} />}
            {result.bonus > 0 && <Line label="Bonus / commission" value={fmtPrecise(result.bonus)} />}
            {result.secondJob > 0 && (
              <Line label="Second job (BR-coded)" value={fmtPrecise(result.secondJob)} />
            )}
            <Line label="Total gross" value={fmtPrecise(totalGross)} bold />
          </ul>
        </div>
      )}

      {result.taxBands.length > 0 && (
        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            How your Income Tax is calculated
          </h3>
          <ul className="mt-3 space-y-2">
            {result.taxBands.map((b, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-token bg-surface-subtle px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: bandColour(b.rate) }}
                  />
                  <span className="font-medium">{b.label}</span>
                  <span className="text-ink-muted">@ {(b.rate * 100).toFixed(0)}%</span>
                </span>
                <span className="tabular-nums">
                  <span className="text-ink-muted">{fmtPrecise(b.amount)} × {(b.rate * 100).toFixed(0)}% =</span>{" "}
                  <span className="font-semibold">{fmtPrecise(b.tax)}</span>
                </span>
              </li>
            ))}
            {result.incomeTaxSecondJob > 0 && (
              <li className="flex items-center justify-between rounded-lg border border-dashed border-token bg-surface-subtle px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#0ea5e9" }} />
                  <span className="font-medium">Second job (BR)</span>
                  <span className="text-ink-muted">@ 20%</span>
                </span>
                <span className="tabular-nums">
                  <span className="text-ink-muted">{fmtPrecise(result.secondJob)} × 20% =</span>{" "}
                  <span className="font-semibold">{fmtPrecise(result.incomeTaxSecondJob)}</span>
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <li
      className={`flex items-center justify-between border-b border-token py-1.5 last:border-0 ${
        bold ? "pt-2 font-semibold" : ""
      }`}
    >
      <span className={bold ? "" : "text-ink-soft"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </li>
  );
}

function hasGrossBreakdown(r: Breakdown): boolean {
  return r.overtime > 0 || r.bonus > 0 || r.secondJob > 0;
}

function grossSub(r: Breakdown): string | undefined {
  const parts: string[] = [];
  if (r.bonus > 0) parts.push(`+ bonus £${r.bonus.toLocaleString()}`);
  if (r.overtime > 0) parts.push(`+ overtime £${r.overtime.toLocaleString()}`);
  if (r.secondJob > 0) parts.push(`+ 2nd job £${r.secondJob.toLocaleString()}`);
  return parts.length ? parts.join(", ") : undefined;
}

function pensionSub(input: CalculatorInput, r: Breakdown): string {
  const t = input.pensionType;
  if (t === "salarySacrifice") return "Salary sacrifice — reduces tax & NI";
  if (t === "auto") return "Auto-enrolment — reduces tax only";
  if (t === "personalRas")
    return `Personal (RAS) — provider adds 20% relief on top${r.pensionExtraRelief > 0 ? "; extra relief via SA" : ""}`;
  return "";
}

function bandColour(rate: number): string {
  if (rate <= 0.2) return "#10b981";
  if (rate <= 0.21) return "#22c55e";
  if (rate <= 0.4) return "#f59e0b";
  if (rate <= 0.42) return "#f97316";
  return "#dc2626";
}
