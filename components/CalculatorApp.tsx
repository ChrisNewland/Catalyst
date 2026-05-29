"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, PiggyBank, GitCompare, X } from "lucide-react";
import SalaryCalculator, { DEFAULT_SALARY_INPUT } from "./SalaryCalculator";
import SalaryComparator from "./SalaryComparator";
import RetirementCalculator from "./RetirementCalculator";
import type { CalculatorInput } from "@/lib/tax";

type ViewTab = "salary" | "retirement";

export default function CalculatorApp() {
  const [salaryInput, setSalaryInput] = useState<CalculatorInput>(DEFAULT_SALARY_INPUT);
  /** Scenario B starts with a sensible alternate gross so the comparator
   *  shows something meaningful the moment it opens. */
  const [salaryInputB, setSalaryInputB] = useState<CalculatorInput>({ ...DEFAULT_SALARY_INPUT, grossInput: 45000 });
  const [tab, setTab] = useState<ViewTab>("salary");
  const [compareMode, setCompareMode] = useState(false);

  const isSalary = tab === "salary";
  const heroTitle = !isSalary
    ? "When can you stop working?"
    : compareMode
      ? "Two salaries, side by side"
      : "What's your take-home pay?";
  const heroBody = !isSalary
    ? "Project your pension and ISA pots through to retirement. Coast FIRE, full FIRE and the UK pension-access bridge — all in today's pounds."
    : compareMode
      ? "Use the Compare view to weigh up a job offer or pension strategy, or the Combine view to see household take-home — each salary is taxed independently (separate codes, separate NI thresholds)."
      : "Enter your gross salary and we'll work out what lands in your bank account after Income Tax, National Insurance, pension and student loan repayments.";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Badge variant="accent" className="rounded-full">
          Tax year 2025 / 2026
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{heroTitle}</h1>
        <p className="max-w-2xl text-muted-foreground">{heroBody}</p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
          <TabsList className="grid h-11 grid-cols-2 p-1 sm:w-auto sm:min-w-[320px]">
            <TabsTrigger value="salary" className="gap-2 px-4">
              <Wallet className="h-4 w-4" />
              Take-home
            </TabsTrigger>
            <TabsTrigger value="retirement" className="gap-2 px-4">
              <PiggyBank className="h-4 w-4" />
              Retirement
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {isSalary &&
          (compareMode ? (
            <Button variant="outline" size="sm" onClick={() => setCompareMode(false)} className="gap-2">
              <X className="h-3.5 w-3.5" />
              Single salary
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setCompareMode(true)} className="gap-2">
              <GitCompare className="h-3.5 w-3.5" />
              Two salaries
            </Button>
          ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
        <TabsContent value="salary" className="mt-0">
          {compareMode ? (
            <SalaryComparator
              inputA={salaryInput}
              setInputA={setSalaryInput}
              inputB={salaryInputB}
              setInputB={setSalaryInputB}
            />
          ) : (
            <SalaryCalculator input={salaryInput} setInput={setSalaryInput} />
          )}
        </TabsContent>
        <TabsContent value="retirement" className="mt-0">
          <RetirementCalculator salaryInput={salaryInput} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
