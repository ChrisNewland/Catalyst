"use client";

import { useMemo, useState } from "react";
import {
  calculate,
  inFrequency,
  TAX_YEARS,
  type CalculatorInput,
  type Frequency,
  type PensionMode,
  type PensionType,
  type Region,
  type StudentLoanPlan,
  type TaxYear,
} from "@/lib/tax";
import Disclosure from "./Disclosure";
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

const PENSION_TYPES: { id: PensionType; label: string; sub: string }[] = [
  { id: "auto", label: "Auto-enrolment", sub: "Net pay arrangement — reduces tax, not NI." },
  { id: "salarySacrifice", label: "Salary sacrifice", sub: "Reduces both tax and NI." },
  { id: "personalRas", label: "Personal (RAS)", sub: "Paid from net pay; provider grosses up." },
  { id: "employer", label: "Employer only", sub: "Doesn't affect your take-home." },
];

export default function SalaryCalculator() {
  const [input, setInput] = useState<CalculatorInput>({
    taxYear: "2025-26",
    grossInput: 35000,
    frequency: "yearly",
    hoursPerWeek: 37.5,
    daysPerWeek: 5,
    bonusAnnual: 0,
    overtimeHoursPerWeek: 0,
    overtimeMultiplier: 1.5,
    secondJobAnnual: 0,
    taxCode: "1257L",
    region: "england",
    age: 30,
    blindAllowance: false,
    marriageAllowance: false,
    pensionMode: "percent",
    pensionType: "auto",
    pensionContribution: 5,
    childcareVouchersMonthly: 0,
    taxableBenefits: 0,
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

  const extrasCount =
    (input.bonusAnnual > 0 ? 1 : 0) +
    (input.overtimeHoursPerWeek > 0 && input.frequency === "hourly" ? 1 : 0) +
    (input.secondJobAnnual > 0 ? 1 : 0);
  const adjustmentsCount =
    (input.childcareVouchersMonthly > 0 ? 1 : 0) +
    (input.taxableBenefits > 0 ? 1 : 0) +
    (input.marriageAllowance ? 1 : 0) +
    (input.blindAllowance ? 1 : 0);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-2">
        <div className="card animate-fade-in p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Your details
            </h2>
            <select
              value={input.taxYear}
              onChange={(e) => update("taxYear", e.target.value as TaxYear)}
              className="rounded-lg border border-token bg-transparent px-2.5 py-1.5 text-xs font-semibold"
              aria-label="Tax year"
            >
              {(Object.keys(TAX_YEARS) as TaxYear[]).map((y) => (
                <option key={y} value={y}>
                  Tax year {TAX_YEARS[y].label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-5">
            <div>
              <label className="label" htmlFor="gross">
                Gross salary
              </label>
              <div className="relative">
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
          </div>
        </div>

        <Disclosure
          title="Pension"
          hint={`${input.pensionContribution || 0}${input.pensionMode === "percent" ? "%" : " £"} · ${labelForType(input.pensionType)}`}
          defaultOpen
        >
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {PENSION_TYPES.map((p) => {
                const selected = input.pensionType === p.id;
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                        : "border-token hover:bg-surface-subtle"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pensionType"
                      checked={selected}
                      onChange={() => update("pensionType", p.id)}
                      className="mt-0.5 h-4 w-4 accent-brand-600"
                    />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{p.label}</span>
                      <span className="text-xs text-ink-muted">{p.sub}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
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
          </div>
        </Disclosure>

        <Disclosure
          title="Student loan"
          hint={input.studentLoans.length ? input.studentLoans.map((p) => labelForLoan(p)).join(" · ") : "Not applicable"}
          badge={input.studentLoans.length || undefined}
        >
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
        </Disclosure>

        <Disclosure
          title="Bonus, overtime & second job"
          hint="Extras taxed at your marginal rate"
          badge={extrasCount || undefined}
        >
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="bonus">
                Annual bonus / commission
              </label>
              <CurrencyInput
                id="bonus"
                value={input.bonusAnnual}
                onChange={(v) => update("bonusAnnual", v)}
              />
            </div>

            {input.frequency === "hourly" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="otHours">
                    Overtime hrs / week
                  </label>
                  <input
                    id="otHours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={input.overtimeHoursPerWeek || ""}
                    onChange={(e) => update("overtimeHoursPerWeek", parseFloat(e.target.value) || 0)}
                    className="input tabular-nums"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="otMult">
                    Overtime multiplier
                  </label>
                  <input
                    id="otMult"
                    type="number"
                    min={1}
                    step={0.1}
                    value={input.overtimeMultiplier || ""}
                    onChange={(e) => update("overtimeMultiplier", parseFloat(e.target.value) || 1)}
                    className="input tabular-nums"
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-token p-3 text-xs text-ink-muted">
                Overtime hours apply when paid hourly. Switch the salary frequency to “Hourly” to add overtime.
              </p>
            )}

            <div>
              <label className="label" htmlFor="secondJob">
                Second job — annual gross (BR tax)
              </label>
              <CurrencyInput
                id="secondJob"
                value={input.secondJobAnnual}
                onChange={(v) => update("secondJobAnnual", v)}
              />
              <p className="mt-1 text-xs text-ink-muted">
                Second jobs use a BR tax code (20% flat) with their own NI thresholds.
              </p>
            </div>
          </div>
        </Disclosure>

        <Disclosure
          title="Other adjustments"
          hint="Childcare vouchers, BIK, marriage & blind allowances"
          badge={adjustmentsCount || undefined}
        >
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="ccv">
                Childcare vouchers (per month)
              </label>
              <CurrencyInput
                id="ccv"
                value={input.childcareVouchersMonthly}
                onChange={(v) => update("childcareVouchersMonthly", v)}
              />
              <p className="mt-1 text-xs text-ink-muted">
                Pre-tax &amp; pre-NI. Legacy scheme capped at £{TAX_YEARS[input.taxYear].childcareVouchers.monthlyCap}/month.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="bik">
                Taxable benefits (BIK) — annual cash value
              </label>
              <CurrencyInput
                id="bik"
                value={input.taxableBenefits}
                onChange={(v) => update("taxableBenefits", v)}
              />
              <p className="mt-1 text-xs text-ink-muted">
                Company car, medical insurance etc. Adds to taxable income — no employee NI.
              </p>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-token p-3">
              <input
                type="checkbox"
                checked={input.marriageAllowance}
                onChange={(e) => update("marriageAllowance", e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium">Marriage Allowance (receiving)</span>
                <span className="text-xs text-ink-muted">
                  Spouse has transferred 10% of their personal allowance (£1,260) to you.
                </span>
              </span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-token p-3">
              <input
                type="checkbox"
                checked={input.blindAllowance}
                onChange={(e) => update("blindAllowance", e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium">Blind Person&apos;s Allowance</span>
                <span className="text-xs text-ink-muted">
                  Adds £{TAX_YEARS[input.taxYear].allowances.blindPersons.toLocaleString()} to your personal allowance.
                </span>
              </span>
            </label>
          </div>
        </Disclosure>
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

function CurrencyInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-ink-muted">£</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={100}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input pl-8 tabular-nums"
      />
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

function labelForType(t: PensionType): string {
  return PENSION_TYPES.find((p) => p.id === t)?.label ?? t;
}

function labelForLoan(p: StudentLoanPlan): string {
  return STUDENT_LOAN_OPTIONS.find((o) => o.id === p)?.label ?? p;
}
