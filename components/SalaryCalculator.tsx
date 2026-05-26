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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  { id: "salarySacrifice", label: "Salary sacrifice", sub: "Reduces tax, NI and student loan base." },
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
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your details
              </h2>
              <Select value={input.taxYear} onValueChange={(v) => update("taxYear", v as TaxYear)}>
                <SelectTrigger className="h-8 w-auto gap-1.5 px-2.5 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TAX_YEARS) as TaxYear[]).map((y) => (
                    <SelectItem key={y} value={y}>
                      Tax year {TAX_YEARS[y].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="gross">Gross salary</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-muted-foreground">
                    £
                  </span>
                  <Input
                    id="gross"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={100}
                    value={input.grossInput || ""}
                    onChange={(e) => update("grossInput", parseFloat(e.target.value) || 0)}
                    className="pl-8 tabular-nums"
                    placeholder="35,000"
                  />
                </div>
                <Tabs value={input.frequency} onValueChange={(v) => update("frequency", v as Frequency)}>
                  <TabsList className="grid w-full grid-cols-5">
                    {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                      <TabsTrigger key={f} value={f} className="text-xs sm:text-sm">
                        {FREQUENCY_LABELS[f]}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {input.frequency === "hourly" && (
                <NumberRow
                  id="hpw"
                  label="Hours per week"
                  value={input.hoursPerWeek}
                  step={0.5}
                  onChange={(v) => update("hoursPerWeek", v)}
                />
              )}
              {input.frequency === "daily" && (
                <NumberRow
                  id="dpw"
                  label="Days per week"
                  value={input.daysPerWeek}
                  step={0.5}
                  onChange={(v) => update("daysPerWeek", v)}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxCode">Tax code</Label>
                  <Input
                    id="taxCode"
                    value={input.taxCode}
                    onChange={(e) => update("taxCode", e.target.value.toUpperCase())}
                    className="tabular-nums"
                    spellCheck={false}
                    autoCapitalize="characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={16}
                    max={100}
                    value={input.age}
                    onChange={(e) => update("age", parseInt(e.target.value, 10) || 0)}
                    className="tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tax region</Label>
                <Tabs value={input.region} onValueChange={(v) => update("region", v as Region)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="england">England, Wales &amp; NI</TabsTrigger>
                    <TabsTrigger value="scotland">Scotland</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        <Disclosure
          title="Pension"
          hint={`${input.pensionContribution || 0}${input.pensionMode === "percent" ? "%" : " £"} · ${labelForType(input.pensionType)}`}
          defaultOpen
        >
          <div className="space-y-4">
            <RadioGroup
              value={input.pensionType}
              onValueChange={(v) => update("pensionType", v as PensionType)}
              className="grid gap-2 sm:grid-cols-2"
            >
              {PENSION_TYPES.map((p) => {
                const selected = input.pensionType === p.id;
                const id = `pen-${p.id}`;
                return (
                  <Label
                    key={p.id}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 normal-case tracking-normal transition-colors",
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <RadioGroupItem value={p.id} id={id} className="mt-0.5" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.sub}</span>
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min={0}
                  step={input.pensionMode === "percent" ? 0.5 : 100}
                  value={input.pensionContribution || ""}
                  onChange={(e) => update("pensionContribution", parseFloat(e.target.value) || 0)}
                  className="pr-12 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground">
                  {input.pensionMode === "percent" ? "%" : "£/yr"}
                </span>
              </div>
              <Tabs value={input.pensionMode} onValueChange={(v) => update("pensionMode", v as PensionMode)}>
                <TabsList>
                  <TabsTrigger value="percent">%</TabsTrigger>
                  <TabsTrigger value="amount">£</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </Disclosure>

        <Disclosure
          title="Student loan"
          hint={input.studentLoans.length ? input.studentLoans.map(labelForLoan).join(" · ") : "Not applicable"}
          badge={input.studentLoans.length || undefined}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {STUDENT_LOAN_OPTIONS.map((o) => {
              const checked = input.studentLoans.includes(o.id);
              const id = `sl-${o.id}`;
              return (
                <Label
                  key={o.id}
                  htmlFor={id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 normal-case tracking-normal transition-colors",
                    checked
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-secondary/60",
                  )}
                >
                  <Checkbox id={id} checked={checked} onCheckedChange={() => toggleLoan(o.id)} className="mt-0.5" />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{o.label}</span>
                    <span className="text-xs text-muted-foreground">{o.sub}</span>
                  </span>
                </Label>
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
            <div className="space-y-2">
              <Label htmlFor="bonus">Annual bonus / commission</Label>
              <CurrencyInput
                id="bonus"
                value={input.bonusAnnual}
                onChange={(v) => update("bonusAnnual", v)}
              />
            </div>

            {input.frequency === "hourly" ? (
              <div className="grid grid-cols-2 gap-4">
                <NumberRow
                  id="otHours"
                  label="Overtime hrs / week"
                  value={input.overtimeHoursPerWeek}
                  step={0.5}
                  onChange={(v) => update("overtimeHoursPerWeek", v)}
                />
                <NumberRow
                  id="otMult"
                  label="Overtime multiplier"
                  value={input.overtimeMultiplier}
                  step={0.1}
                  onChange={(v) => update("overtimeMultiplier", v)}
                />
              </div>
            ) : (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Overtime hours apply when paid hourly. Switch the salary frequency to “Hourly” to add overtime.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="secondJob">Second job — annual gross (BR tax)</Label>
              <CurrencyInput
                id="secondJob"
                value={input.secondJobAnnual}
                onChange={(v) => update("secondJobAnnual", v)}
              />
              <p className="text-xs text-muted-foreground">
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
            <div className="space-y-2">
              <Label htmlFor="ccv">Childcare vouchers (per month)</Label>
              <CurrencyInput
                id="ccv"
                value={input.childcareVouchersMonthly}
                onChange={(v) => update("childcareVouchersMonthly", v)}
              />
              <p className="text-xs text-muted-foreground">
                Pre-tax &amp; pre-NI. Legacy scheme capped at £{TAX_YEARS[input.taxYear].childcareVouchers.monthlyCap}/month.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bik">Taxable benefits (BIK) — annual cash value</Label>
              <CurrencyInput
                id="bik"
                value={input.taxableBenefits}
                onChange={(v) => update("taxableBenefits", v)}
              />
              <p className="text-xs text-muted-foreground">
                Company car, medical insurance etc. Adds to taxable income — no employee NI.
              </p>
            </div>
            <CheckCard
              checked={input.marriageAllowance}
              onChange={(v) => update("marriageAllowance", v)}
              label="Marriage Allowance (receiving)"
              hint="Spouse has transferred 10% of their personal allowance (£1,260) to you."
            />
            <CheckCard
              checked={input.blindAllowance}
              onChange={(v) => update("blindAllowance", v)}
              label="Blind Person's Allowance"
              hint={`Adds £${TAX_YEARS[input.taxYear].allowances.blindPersons.toLocaleString()} to your personal allowance.`}
            />
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
      <span className="pointer-events-none absolute inset-y-0 left-0 grid w-9 place-items-center text-muted-foreground">£</span>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={100}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="pl-8 tabular-nums"
      />
    </div>
  );
}

function NumberRow({
  id,
  label,
  value,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="tabular-nums"
      />
    </div>
  );
}

function CheckCard({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  const id = `chk-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 normal-case tracking-normal transition-colors",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:bg-secondary/60",
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </Label>
  );
}

function labelForType(t: PensionType): string {
  return PENSION_TYPES.find((p) => p.id === t)?.label ?? t;
}

function labelForLoan(p: StudentLoanPlan): string {
  return STUDENT_LOAN_OPTIONS.find((o) => o.id === p)?.label ?? p;
}
