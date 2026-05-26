"use client";

import type { Breakdown, CalculatorInput, Frequency } from "@/lib/tax";
import BreakdownBar from "./BreakdownBar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";

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
  swatch?: string;
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
    { label: "Gross pay", amount: totalGross, sign: "+", tone: "text-foreground", sub: grossSub(result) },
  ];
  if (result.taxableBenefits > 0) {
    rows.push({
      label: "Taxable benefits (BIK)",
      amount: result.taxableBenefits,
      sign: "+",
      tone: "text-muted-foreground",
      sub: "Phantom income — taxed but no cash received",
      swatch: "money-bik",
    });
  }
  rows.push(
    { label: "Income Tax", amount: result.incomeTax, sign: "-", tone: "text-[hsl(var(--money-tax))]", swatch: "money-tax" },
    { label: "National Insurance", amount: result.nationalInsurance, sign: "-", tone: "text-[hsl(var(--money-ni))]", swatch: "money-ni" },
  );
  if (result.pension > 0) {
    rows.push({
      label: "Pension",
      amount: result.pension,
      sign: "-",
      tone: "text-[hsl(var(--money-pension))]",
      sub: pensionSub(input, result),
      swatch: "money-pension",
    });
  }
  if (result.childcareVouchers > 0) {
    rows.push({
      label: "Childcare vouchers",
      amount: result.childcareVouchers,
      sign: "-",
      tone: "text-[hsl(var(--money-childcare))]",
      swatch: "money-childcare",
    });
  }
  if (result.studentLoan > 0) {
    rows.push({
      label: "Student loan",
      amount: result.studentLoan,
      sign: "-",
      tone: "text-[hsl(var(--money-loan))]",
      swatch: "money-loan",
    });
  }

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in overflow-hidden">
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Take-home per {FREQUENCY_LABELS[view].toLowerCase()}
              </p>
              <p className="mt-1 font-display text-4xl font-bold tracking-tight tabular-nums text-[hsl(var(--money-income))] sm:text-5xl">
                {fmt(inFrequency(result.takeHome))}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                From {fmt(inFrequency(totalGross))} gross ·{" "}
                <span className="font-medium text-foreground">
                  {(((result.takeHome / Math.max(1, totalGross)) * 100) || 0).toFixed(1)}% kept
                </span>
              </p>
            </div>
            <Tabs value={view} onValueChange={(v) => onViewChange(v as Frequency)}>
              <TabsList>
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                  <TabsTrigger key={f} value={f} className="text-xs sm:text-sm">
                    {FREQUENCY_LABELS[f]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <BreakdownBar
            segments={[
              { label: "Take-home", value: result.takeHome, var: "money-income" },
              { label: "Income Tax", value: result.incomeTax, var: "money-tax" },
              { label: "NI", value: result.nationalInsurance, var: "money-ni" },
              { label: "Pension", value: result.pension, var: "money-pension" },
              { label: "Childcare", value: result.childcareVouchers, var: "money-childcare" },
              { label: "Student loan", value: result.studentLoan, var: "money-loan" },
            ]}
          />

          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-3 py-2.5">
                <span className="flex items-start gap-2">
                  {r.swatch ? (
                    <span
                      className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: `hsl(var(--${r.swatch}))` }}
                    />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0" />
                  )}
                  <span className="flex flex-col">
                    <span className="text-sm text-foreground">{r.label}</span>
                    {r.sub && <span className="text-xs text-muted-foreground">{r.sub}</span>}
                  </span>
                </span>
                <span className={`text-sm font-semibold tabular-nums ${r.tone}`}>
                  {r.sign === "-" && r.amount > 0 ? "− " : ""}
                  {fmt(inFrequency(r.amount))}
                </span>
              </li>
            ))}
            <Separator />
            <li className="flex items-center justify-between pt-3">
              <span className="text-sm font-semibold">Take-home</span>
              <span className="font-display text-base font-bold tabular-nums text-[hsl(var(--money-income))]">
                {fmt(inFrequency(result.takeHome))}
              </span>
            </li>
          </ul>

          {result.pensionExtraRelief > 0 && (
            <div className="flex items-start gap-2.5 rounded-md border border-[hsl(var(--money-income)/.3)] bg-[hsl(var(--money-income)/.08)] p-3 text-xs text-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--money-income))]" />
              <span>
                <strong className="font-semibold">{fmtPrecise(result.pensionExtraRelief)}/yr</strong> reclaimable via
                Self-Assessment — higher / additional-rate relief on your RAS pension contribution.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

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
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross income breakdown
            </h3>
            <ul className="space-y-1.5 text-sm">
              <Line label="Base salary" value={fmtPrecise(result.baseSalary)} />
              {result.overtime > 0 && <Line label="Overtime" value={fmtPrecise(result.overtime)} />}
              {result.bonus > 0 && <Line label="Bonus / commission" value={fmtPrecise(result.bonus)} />}
              {result.secondJob > 0 && <Line label="Second job (BR-coded)" value={fmtPrecise(result.secondJob)} />}
              <Line label="Total gross" value={fmtPrecise(totalGross)} bold />
            </ul>
          </CardContent>
        </Card>
      )}

      {result.taxBands.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              How your Income Tax is calculated
            </h3>
            <ul className="space-y-2">
              {result.taxBands.map((b, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: bandColour(b.rate) }}
                    />
                    <span className="font-medium">{b.label}</span>
                    <span className="text-muted-foreground">@ {(b.rate * 100).toFixed(0)}%</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-muted-foreground">{fmtPrecise(b.amount)} × {(b.rate * 100).toFixed(0)}% =</span>{" "}
                    <span className="font-semibold">{fmtPrecise(b.tax)}</span>
                  </span>
                </li>
              ))}
              {result.incomeTaxSecondJob > 0 && (
                <li className="flex items-center justify-between rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--money-bik))]" />
                    <span className="font-medium">Second job (BR)</span>
                    <span className="text-muted-foreground">@ 20%</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-muted-foreground">{fmtPrecise(result.secondJob)} × 20% =</span>{" "}
                    <span className="font-semibold">{fmtPrecise(result.incomeTaxSecondJob)}</span>
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-xl font-bold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Line({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <li
      className={`flex items-center justify-between border-b py-1.5 last:border-0 ${
        bold ? "pt-2 font-semibold" : ""
      }`}
    >
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
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
  if (t === "salarySacrifice") return "Salary sacrifice — reduces tax, NI & SL base";
  if (t === "auto") return "Auto-enrolment — reduces tax only";
  if (t === "personalRas")
    return `Personal (RAS) — provider adds 20% relief on top${r.pensionExtraRelief > 0 ? "; extra relief via SA" : ""}`;
  return "";
}

function bandColour(rate: number): string {
  if (rate <= 0.2) return "hsl(var(--money-income))";
  if (rate <= 0.21) return "hsl(var(--money-childcare))";
  if (rate <= 0.4) return "hsl(var(--money-ni))";
  if (rate <= 0.42) return "hsl(var(--money-loan))";
  return "hsl(var(--money-tax))";
}
