"use client";

import { useMemo, useState } from "react";
import {
  calculate,
  inFrequency,
  type CalculatorInput,
  type Frequency,
  type PensionMode,
  type Region,
  type StudentLoanPlan,
} from "@/lib/tax";
import ResultPanel from "./ResultPanel";

const FREQUENCY_LABELS: Record<Frequency, string> = {
  yearly: "Yearly",
  monthly: "Monthly",
  weekly: "Weekly",
  daily: "Daily",
  hourly: "Hourly",
};

const STUDENT_LOAN_OPTIONS: { id: StudentLoanPlan; label: string; sub: string }[] = [
  { id: "plan1", label: "Plan 1", sub: "Pre-2012 (England/Wales)" },
  { id: "plan2", label: "Plan 2", sub: "Post-2012 (England/Wales)" },
  { id: "plan4", label: "Plan 4", sub: "Scotland" },
  { id: "plan5", label: "Plan 5", sub: "Post-Aug 2023 (England)" },
  { id: "postgrad", label: "Postgrad", sub: "Masters / Doctoral" },
];

export default function SalaryCalculator() {
  const [input, setInput] = useState<CalculatorInput>({
    grossInput: 35000,
    frequency: "yearly",
    hoursPerWeek: 37.5,
    daysPerWeek: 5,
    taxCode: "1257L",
    region: "england",
    age: 30,
    blindAllowance: false,
    pensionMode: "percent",
    pensionContribution: 5,
    studentLoans: [],
  });

  const [resultView, setResultView] = useState<Frequency>("monthly");

  const result = useMemo(() => calculate(input), [input]);

  function update<K extends keyof CalculatorInput>(key: K, value: CalculatorInput[K]) {
    setInput((s) => ({ ...s, [key]: value }));
  }

  function toggleLoan(plan: StudentLoanPlan) {
    setInput((s) => ({
      ...s,
      studentLoans: s.studentLoans.includes(plan)
        ? s.studentLoans.filter((p) => p !== plan)
        : [...s.studentLoans, plan],
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="card animate-fade-in p-5 sm:p-6 lg:col-span-2">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Your details
        </h2>

        <div className="space-y-5">
          <div>
            <label className="label" htmlFor="gross">
              Gross salary
            </label>
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-ink-muted">
                  £
                </span>
                <input
                  id="gross"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={100}
                  value={input.grossInput || ""}
                  onChange={(e) => update("grossInput", parseFloat(e.target.value) || 0)}
                  className="input pl-8 tabular-nums"
                  placeholder="35,000"
                />
              </div>
            </div>
            <div className="segmented mt-2">
              {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  data-active={input.frequency === f}
                  onClick={() => update("frequency", f)}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {input.frequency === "hourly" && (
            <NumberRow
              label="Hours per week"
              value={input.hoursPerWeek}
              step={0.5}
              onChange={(v) => update("hoursPerWeek", v)}
            />
          )}
          {input.frequency === "daily" && (
            <NumberRow
              label="Days per week"
              value={input.daysPerWeek}
              step={0.5}
              onChange={(v) => update("daysPerWeek", v)}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="taxCode">
                Tax code
              </label>
              <input
                id="taxCode"
                type="text"
                value={input.taxCode}
                onChange={(e) => update("taxCode", e.target.value.toUpperCase())}
                className="input tabular-nums"
                spellCheck={false}
                autoCapitalize="characters"
              />
            </div>
            <div>
              <label className="label" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                type="number"
                min={16}
                max={100}
                value={input.age}
                onChange={(e) => update("age", parseInt(e.target.value, 10) || 0)}
                className="input tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="label">Tax region</span>
            <div className="segmented">
              {(["england", "scotland"] as Region[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  data-active={input.region === r}
                  onClick={() => update("region", r)}
                >
                  {r === "england" ? "England, Wales & NI" : "Scotland"}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="rounded-xl border border-token p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Pension contribution
            </legend>
            <div className="mt-1 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  step={input.pensionMode === "percent" ? 0.5 : 100}
                  value={input.pensionContribution || ""}
                  onChange={(e) => update("pensionContribution", parseFloat(e.target.value) || 0)}
                  className="input pr-12 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 grid w-10 place-items-center text-ink-muted">
                  {input.pensionMode === "percent" ? "%" : "£/yr"}
                </span>
              </div>
              <div className="segmented w-auto">
                {(["percent", "amount"] as PensionMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    data-active={input.pensionMode === m}
                    onClick={() => update("pensionMode", m)}
                  >
                    {m === "percent" ? "%" : "£"}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Student loan</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {STUDENT_LOAN_OPTIONS.map((o) => {
                const checked = input.studentLoans.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      checked
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                        : "border-token hover:bg-surface-subtle"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLoan(o.id)}
                      className="mt-0.5 h-4 w-4 accent-brand-600"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{o.label}</span>
                      <span className="text-xs text-ink-muted">{o.sub}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="flex items-center gap-3 rounded-xl border border-token p-3">
            <input
              type="checkbox"
              checked={input.blindAllowance}
              onChange={(e) => update("blindAllowance", e.target.checked)}
              className="h-4 w-4 accent-brand-600"
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium">Blind Person&apos;s Allowance</span>
              <span className="text-xs text-ink-muted">Adds £3,130 to your personal allowance.</span>
            </span>
          </label>
        </div>
      </section>

      <section className="lg:col-span-3">
        <ResultPanel
          input={input}
          result={result}
          view={resultView}
          onViewChange={setResultView}
          inFrequency={(amt) => inFrequency(amt, resultView, input)}
        />
      </section>
    </div>
  );
}

function NumberRow({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        step={step}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input tabular-nums"
      />
    </div>
  );
}
