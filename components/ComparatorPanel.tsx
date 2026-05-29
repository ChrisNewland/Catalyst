"use client";

import { useMemo, useState } from "react";
import { calculate, inFrequency, type Breakdown, type CalculatorInput, type Frequency } from "@/lib/tax";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import BreakdownBar from "./BreakdownBar";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  yearly: "Year",
  monthly: "Month",
  weekly: "Week",
  daily: "Day",
  hourly: "Hour",
};

interface Row {
  label: string;
  pickA: number;
  pickB: number;
  /** "+" means a larger value is good for the user (take-home). "-" means larger = worse. */
  goodDirection: "+" | "-";
  swatch?: string;
}

export default function ComparatorPanel({
  inputA,
  inputB,
  nameA = "A",
  nameB = "B",
}: {
  inputA: CalculatorInput;
  inputB: CalculatorInput;
  nameA?: string;
  nameB?: string;
}) {
  const [view, setView] = useState<Frequency>("monthly");
  const resultA = useMemo(() => calculate(inputA), [inputA]);
  const resultB = useMemo(() => calculate(inputB), [inputB]);

  /** Average the hours/days inputs for frequency conversion in compare mode —
   *  if both scenarios use the same value (the typical case), the average is that value. */
  const conv = {
    hoursPerWeek: (inputA.hoursPerWeek + inputB.hoursPerWeek) / 2 || 1,
    daysPerWeek: (inputA.daysPerWeek + inputB.daysPerWeek) / 2 || 1,
  };
  const inFreq = (annualAmount: number) => inFrequency(annualAmount, view, conv);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: view === "hourly" || view === "daily" ? 2 : 0,
      minimumFractionDigits: view === "hourly" || view === "daily" ? 2 : 0,
    }).format(n);
  const fmtSigned = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;

  const grossA = resultA.gross + resultA.secondJob;
  const grossB = resultB.gross + resultB.secondJob;

  const rows: Row[] = [
    { label: "Gross pay", pickA: grossA, pickB: grossB, goodDirection: "+" },
    { label: "Income Tax", pickA: resultA.incomeTax, pickB: resultB.incomeTax, goodDirection: "-", swatch: "money-tax" },
    {
      label: "National Insurance",
      pickA: resultA.nationalInsurance,
      pickB: resultB.nationalInsurance,
      goodDirection: "-",
      swatch: "money-ni",
    },
    { label: "Pension", pickA: resultA.pension, pickB: resultB.pension, goodDirection: "-", swatch: "money-pension" },
  ];
  if (resultA.childcareVouchers > 0 || resultB.childcareVouchers > 0) {
    rows.push({
      label: "Childcare vouchers",
      pickA: resultA.childcareVouchers,
      pickB: resultB.childcareVouchers,
      goodDirection: "-",
      swatch: "money-childcare",
    });
  }
  if (resultA.studentLoan > 0 || resultB.studentLoan > 0) {
    rows.push({
      label: "Student loan",
      pickA: resultA.studentLoan,
      pickB: resultB.studentLoan,
      goodDirection: "-",
      swatch: "money-loan",
    });
  }

  const headlineDelta = resultB.takeHome - resultA.takeHome;
  const winner = Math.abs(headlineDelta) < 0.5 ? null : headlineDelta > 0 ? nameB : nameA;
  const headlineColour =
    winner === null
      ? "text-foreground"
      : winner === nameB
        ? "text-[hsl(var(--money-income))]"
        : "text-[hsl(var(--money-tax))]";

  return (
    <div className="space-y-6">
      <Card className="animate-fade-in overflow-hidden">
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Take-home delta per {FREQUENCY_LABELS[view].toLowerCase()}
              </p>
              <p className={`mt-1 font-display text-4xl font-bold tracking-tight tabular-nums sm:text-5xl ${headlineColour}`}>
                {fmtSigned(inFreq(headlineDelta))}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {winner === null ? (
                  <>Effectively identical take-home.</>
                ) : (
                  <>
                    <span className="font-medium text-foreground">{winner}</span> takes home more.{" "}
                    {nameA}: {fmt(inFreq(resultA.takeHome))} · {nameB}: {fmt(inFreq(resultB.takeHome))}
                  </>
                )}
              </p>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as Frequency)}>
              <TabsList>
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                  <TabsTrigger key={f} value={f} className="text-xs sm:text-sm">
                    {FREQUENCY_LABELS[f]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Side-by-side breakdown bars */}
          <div className="space-y-3">
            <ScenarioBar name={nameA} result={resultA} />
            <ScenarioBar name={nameB} result={resultB} />
          </div>

          {/* Side-by-side table with delta column */}
          <div>
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 gap-y-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span />
              <span className="text-right">{nameA}</span>
              <span className="text-right">{nameB}</span>
              <span className="text-right">Δ</span>
            </div>
            <Separator className="mt-2" />
            <ul className="divide-y">
              {rows.map((r) => (
                <ComparatorRow
                  key={r.label}
                  row={r}
                  fmt={(n) => fmt(inFreq(n))}
                  fmtSigned={(n) => fmtSigned(inFreq(n))}
                />
              ))}
            </ul>
            <Separator />
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 pt-3">
              <span className="text-sm font-semibold">Take-home</span>
              <span className="text-sm font-bold tabular-nums">{fmt(inFreq(resultA.takeHome))}</span>
              <span className="text-sm font-bold tabular-nums">{fmt(inFreq(resultB.takeHome))}</span>
              <DeltaCell delta={headlineDelta} goodDirection="+" fmtSigned={(n) => fmtSigned(inFreq(n))} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat-card row: highlight the metrics where comparison is most useful */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatPairCard label="Effective tax + NI" a={`${(resultA.effectiveTaxRate * 100).toFixed(1)}%`} b={`${(resultB.effectiveTaxRate * 100).toFixed(1)}%`} nameA={nameA} nameB={nameB} />
        <StatPairCard label="Marginal rate" a={`${(resultA.marginalRate * 100).toFixed(0)}%`} b={`${(resultB.marginalRate * 100).toFixed(0)}%`} nameA={nameA} nameB={nameB} />
        <StatPairCard label="% of gross kept" a={`${((resultA.takeHome / Math.max(1, grossA)) * 100).toFixed(1)}%`} b={`${((resultB.takeHome / Math.max(1, grossB)) * 100).toFixed(1)}%`} nameA={nameA} nameB={nameB} />
      </div>
    </div>
  );
}

function ComparatorRow({
  row,
  fmt,
  fmtSigned,
}: {
  row: Row;
  fmt: (n: number) => string;
  fmtSigned: (n: number) => string;
}) {
  const delta = row.pickB - row.pickA;
  return (
    <li className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 py-2">
      <span className="flex items-center gap-2 text-sm">
        {row.swatch ? (
          <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: `hsl(var(--${row.swatch}))` }} />
        ) : (
          <span className="h-2 w-2" />
        )}
        <span className="text-foreground">{row.label}</span>
      </span>
      <span className="text-sm tabular-nums">{fmt(row.pickA)}</span>
      <span className="text-sm tabular-nums">{fmt(row.pickB)}</span>
      <DeltaCell delta={delta} goodDirection={row.goodDirection} fmtSigned={fmtSigned} />
    </li>
  );
}

function DeltaCell({
  delta,
  goodDirection,
  fmtSigned,
  bold = false,
}: {
  delta: number;
  goodDirection: "+" | "-";
  fmtSigned: (n: number) => string;
  bold?: boolean;
}) {
  const isZero = Math.abs(delta) < 0.5;
  const good = goodDirection === "+" ? delta > 0 : delta < 0;
  const colour = isZero
    ? "text-muted-foreground"
    : good
      ? "text-[hsl(var(--money-income))]"
      : "text-[hsl(var(--money-tax))]";
  const Icon = isZero ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center justify-end gap-1 text-sm tabular-nums ${colour} ${bold ? "font-bold" : "font-semibold"}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      {fmtSigned(delta)}
    </span>
  );
}

function ScenarioBar({ name, result }: { name: string; result: Breakdown }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">{name}</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(((result.takeHome / Math.max(1, result.gross + result.secondJob)) * 100))}% kept
        </span>
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
        compact
      />
    </div>
  );
}

function StatPairCard({ label, a, b, nameA, nameB }: { label: string; a: string; b: string; nameA: string; nameB: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{nameA}</p>
            <p className="font-display text-lg font-bold tabular-nums">{a}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{nameB}</p>
            <p className="font-display text-lg font-bold tabular-nums">{b}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
