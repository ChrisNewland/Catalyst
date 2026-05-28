"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wallet, PiggyBank } from "lucide-react";
import SalaryCalculator, { DEFAULT_SALARY_INPUT } from "./SalaryCalculator";
import RetirementCalculator from "./RetirementCalculator";
import type { CalculatorInput } from "@/lib/tax";

type ViewTab = "salary" | "retirement";

export default function CalculatorApp() {
  const [salaryInput, setSalaryInput] = useState<CalculatorInput>(DEFAULT_SALARY_INPUT);
  const [tab, setTab] = useState<ViewTab>("salary");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Badge variant="accent" className="rounded-full">
          Tax year 2025 / 2026
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {tab === "salary" ? (
            <>What&apos;s your take-home pay?</>
          ) : (
            <>When can you stop working?</>
          )}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {tab === "salary"
            ? "Enter your gross salary and we'll work out what lands in your bank account after Income Tax, National Insurance, pension and student loan repayments."
            : "Project your pension and ISA pots through to retirement. Coast FIRE, full FIRE and the UK pension-access bridge — all in today's pounds."}
        </p>
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)} className="space-y-6">
        <TabsList className="grid h-11 w-full max-w-md grid-cols-2 p-1">
          <TabsTrigger value="salary" className="gap-2">
            <Wallet className="h-4 w-4" />
            Take-home
          </TabsTrigger>
          <TabsTrigger value="retirement" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Retirement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salary" className="mt-0">
          <SalaryCalculator input={salaryInput} setInput={setSalaryInput} />
        </TabsContent>
        <TabsContent value="retirement" className="mt-0">
          <RetirementCalculator salaryInput={salaryInput} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
