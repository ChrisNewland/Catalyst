"use client";

import { useMemo, useState } from "react";
import {
  projectRetirement,
  pensionContributionFromSalary,
  DEFAULT_RETIREMENT_INPUT,
  type RetirementInput,
} from "@/lib/retirement";
import { annualiseGross, type CalculatorInput } from "@/lib/tax";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Disclosure from "./Disclosure";
import RetirementProjectionChart from "./RetirementProjectionChart";
import { AlertTriangle, Sparkles, Wand2 } from "lucide-react";

interface Props {
  salaryInput: CalculatorInput;
}

export default function RetirementCalculator({ salaryInput }: Props) {
  /** Seed from the salary tab on first mount; "Sync from salary" lets the user
   *  pull values in again after editing if they want. */
  const [input, setInput] = useState<RetirementInput>(() => {
    const annualGross = annualiseGross(salaryInput);
    const employee = pensionContributionFromSalary({
      annualGross,
      pensionMode: salaryInput.pensionMode,
      pensionContribution: salaryInput.pensionContribution,
      pensionType: salaryInput.pensionType,
    });
    return {
      ...DEFAULT_RETIREMENT_INPUT,
      currentAge: salaryInput.age,
      annualPensionContribution: employee > 0 ? employee : DEFAULT_RETIREMENT_INPUT.annualPensionContribution,
    };
  });

  /** Explicit user action to overwrite age + pension contribution from salary state. */
  function syncFromSalary() {
    const annualGross = annualiseGross(salaryInput);
    const employee = pensionContributionFromSalary({
      annualGross,
      pensionMode: salaryInput.pensionMode,
      pensionContribution: salaryInput.pensionContribution,
      pensionType: salaryInput.pensionType,
    });
    setInput((s) => ({
      ...s,
      currentAge: salaryInput.age,
      annualPensionContribution: employee,
    }));
  }

  function update<K extends keyof RetirementInput>(key: K, value: RetirementInput[K]) {
    setInput((s) => ({ ...s, [key]: value }));
  }

  const projection = useMemo(() => projectRetirement(input), [input]);

  const fmt0 = (n: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
  const fmtCompact = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2)}m`;
    if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
    return fmt0(n);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-2">
        <Card className="animate-fade-in">
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                About you
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={syncFromSalary}
                title="Pull current age and employee pension contribution from the Take-home tab"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Sync from salary
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumField id="curAge" label="Current age" value={input.currentAge} step={1} onChange={(v) => update("currentAge", v)} />
              <NumField
                id="tgtAge"
                label="Target retirement"
                value={input.targetRetirementAge}
                step={1}
                onChange={(v) => update("targetRetirementAge", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spend">Annual spend in retirement</Label>
              <CurrencyInput id="spend" value={input.annualSpend} step={500} onChange={(v) => update("annualSpend", v)} />
              <p className="text-xs text-muted-foreground">
                In today&apos;s £. Use the figure you&apos;d live comfortably on, not your current pre-tax salary.
              </p>
            </div>
          </CardContent>
        </Card>

        <Disclosure title="Pots & contributions" hint="Pension + ISA / GIA bridge" defaultOpen>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="penPot">Current pension pot</Label>
              <CurrencyInput id="penPot" value={input.currentPensionPot} step={1000} onChange={(v) => update("currentPensionPot", v)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="penContrib">Annual pension contribution</Label>
              <CurrencyInput
                id="penContrib"
                value={input.annualPensionContribution}
                step={500}
                onChange={(v) => update("annualPensionContribution", v)}
              />
              <p className="text-xs text-muted-foreground">
                Total: employee + employer + tax relief. Pre-filled with your employee contribution — add your employer
                match.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="isaPot">Current ISA / bridge pot</Label>
              <CurrencyInput id="isaPot" value={input.currentIsaPot} step={1000} onChange={(v) => update("currentIsaPot", v)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isaContrib">Annual ISA contribution</Label>
              <CurrencyInput
                id="isaContrib"
                value={input.annualIsaContribution}
                step={500}
                onChange={(v) => update("annualIsaContribution", v)}
              />
              <p className="text-xs text-muted-foreground">
                ISAs (or any non-pension pot) fund the years between &ldquo;stop work&rdquo; and pension access age.
              </p>
            </div>
          </div>
        </Disclosure>

        <Disclosure title="Assumptions" hint={`${(input.realReturnRate * 100).toFixed(1)}% real return · ${(input.swr * 100).toFixed(1)}% SWR`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <PctField id="rret" label="Real annual return" value={input.realReturnRate} step={0.005} onChange={(v) => update("realReturnRate", v)} />
              <PctField id="swr" label="Safe withdrawal rate" value={input.swr} step={0.001} onChange={(v) => update("swr", v)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Returns are <em>real</em> — already net of inflation, so all figures stay in today&apos;s £.
              Conservative defaults: 5% real return, 3.5% SWR (UK-adjusted from the US 4% rule).
            </p>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <NumField id="penAccess" label="Pension access age" value={input.pensionAccessAge} step={1} onChange={(v) => update("pensionAccessAge", v)} />
              <NumField id="spAge" label="State pension age" value={input.statePensionAge} step={1} onChange={(v) => update("statePensionAge", v)} />
            </div>
            <CheckboxRow
              checked={input.includeStatePension}
              onChange={(v) => update("includeStatePension", v)}
              label="Include state pension"
              hint="Reduces the spend your pot has to cover from state pension age onwards."
            />
            {input.includeStatePension && (
              <div className="space-y-2">
                <Label htmlFor="spAnnual">Annual state pension</Label>
                <CurrencyInput
                  id="spAnnual"
                  value={input.statePensionAnnual}
                  step={100}
                  onChange={(v) => update("statePensionAnnual", v)}
                />
                <p className="text-xs text-muted-foreground">
                  2025/26 full new State Pension: £11,973/yr (requires 35 qualifying NI years).
                </p>
              </div>
            )}
          </div>
        </Disclosure>
      </section>

      <section className="space-y-6 lg:col-span-3">
        <Card className="animate-fade-in overflow-hidden">
          <CardContent className="space-y-5 pt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Projection at age {input.targetRetirementAge}
              </p>
              <p className="mt-1 font-display text-4xl font-bold tracking-tight tabular-nums text-[hsl(var(--money-income))] sm:text-5xl">
                {fmtCompact(projection.projectedTotalAtTarget)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pension {fmtCompact(projection.projectedPensionAtTarget)} · ISA{" "}
                {fmtCompact(projection.projectedIsaAtTarget)}
                {projection.fireAge !== null && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-medium text-foreground">
                      {projection.fireAge <= input.targetRetirementAge
                        ? `FIRE at ${projection.fireAge}`
                        : `Pot covers FIRE by ${projection.fireAge}`}
                    </span>
                  </>
                )}
              </p>
            </div>

            <RetirementProjectionChart
              data={projection.yearly}
              fireNumber={projection.fireNumber}
              targetAge={input.targetRetirementAge}
              pensionAccessAge={input.pensionAccessAge}
              statePensionAge={input.statePensionAge}
            />

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Legend swatch="money-pension" label="Pension" />
              <Legend swatch="money-income" label="ISA / bridge" />
              <Legend swatch="money-tax" label="FIRE number" dashed />
              <Legend swatch="money-loan" label="Pension access" dashed />
              <Legend swatch="money-childcare" label="State pension" dashed />
            </div>

            {projection.bridgeShortfall > 0 && (
              <div className="flex items-start gap-2.5 rounded-md border border-[hsl(var(--money-loan)/0.35)] bg-[hsl(var(--money-loan)/0.08)] p-3 text-xs">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--money-loan))]" />
                <span>
                  <strong className="font-semibold">Bridge shortfall: {fmtCompact(projection.bridgeShortfall)}.</strong>{" "}
                  You retire at {input.targetRetirementAge} but can&apos;t access your pension until{" "}
                  {input.pensionAccessAge} — those {projection.bridgeGapYears} years need to be funded from ISAs / GIAs.
                  Your projected bridge pot of {fmtCompact(projection.projectedIsaAtTarget)} falls short of the{" "}
                  {fmtCompact(projection.bridgeFundsNeeded)} required.
                </span>
              </div>
            )}

            {projection.canCoastNow && (
              <div className="flex items-start gap-2.5 rounded-md border border-[hsl(var(--money-income)/0.3)] bg-[hsl(var(--money-income)/0.08)] p-3 text-xs">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--money-income))]" />
                <span>
                  <strong className="font-semibold">You&apos;ve already hit Coast FIRE.</strong> Your current pots, left
                  to compound until {input.targetRetirementAge}, already exceed your FIRE number — any further
                  contributions are accelerators, not requirements.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="FIRE number"
            value={fmtCompact(projection.fireNumber)}
            hint={`${fmt0(input.annualSpend)} ÷ ${(input.swr * 100).toFixed(1)}% SWR`}
          />
          <StatCard
            label="Coast FIRE today"
            value={fmtCompact(projection.coastFireToday)}
            hint={`Pot needed now to coast to ${input.targetRetirementAge} with zero further contributions`}
          />
          <StatCard
            label={projection.canCoastNow ? "Coasting from" : "Stop contributing at"}
            value={projection.coastFireAge !== null ? `Age ${projection.coastFireAge}` : "—"}
            hint={
              projection.coastFireAge !== null
                ? "Pause contributions then; pot still grows to FIRE by target"
                : `Not reachable by ${input.targetRetirementAge} at this contribution rate`
            }
          />
        </div>

        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why the numbers move
            </h3>
            <ul className="space-y-1.5 text-sm">
              <Sensitivity
                label="State pension reduces post-67 spending need"
                value={
                  input.includeStatePension
                    ? `${fmtCompact(projection.fireNumber)} → ${fmtCompact(projection.fireNumberWithStatePension)} once state pension kicks in`
                    : "Off — toggle in Assumptions to model"
                }
              />
              <Sensitivity
                label="Real return assumption"
                value={`Every 1% you change ${(input.realReturnRate * 100).toFixed(1)}% shifts the timeline by ~5 years.`}
              />
              <Sensitivity
                label="UK pension access constraint"
                value={
                  projection.bridgeGapYears > 0
                    ? `${projection.bridgeGapYears} years between ${input.targetRetirementAge} and ${input.pensionAccessAge} need ISA / GIA cover.`
                    : "Target ≥ pension access age — no ISA bridge needed."
                }
              />
            </ul>
          </CardContent>
        </Card>

        <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
          Projections only — not financial advice. Real returns are uncertain; small changes compound massively.
        </Badge>
      </section>
    </div>
  );
}

function NumField({
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
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="tabular-nums"
      />
    </div>
  );
}

function CurrencyInput({
  id,
  value,
  step,
  onChange,
}: {
  id: string;
  value: number;
  step: number;
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
        step={step}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="pl-8 tabular-nums"
      />
    </div>
  );
}

function PctField({
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
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={0}
          step={step * 100}
          value={value !== undefined ? (value * 100).toFixed(2) : ""}
          onChange={(e) => onChange(parseFloat(e.target.value) / 100 || 0)}
          className="pr-9 tabular-nums"
        />
        <span className="pointer-events-none absolute inset-y-0 right-0 grid w-9 place-items-center text-muted-foreground">
          %
        </span>
      </div>
    </div>
  );
}

function CheckboxRow({
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
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 normal-case tracking-normal transition-colors ${
        checked ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:bg-secondary/60"
      }`}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </Label>
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

function Legend({ swatch, label, dashed = false }: { swatch: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-3 shrink-0 rounded-sm"
        style={{
          background: dashed ? "transparent" : `hsl(var(--${swatch}))`,
          border: dashed ? `1px dashed hsl(var(--${swatch}))` : undefined,
        }}
      />
      <span className="font-medium text-foreground">{label}</span>
    </span>
  );
}

function Sensitivity({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex flex-col gap-0.5 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{value}</span>
    </li>
  );
}
