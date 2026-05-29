"use client";

import { useMemo, useState } from "react";
import { calculate, inFrequency, type CalculatorInput, type Frequency } from "@/lib/tax";
import SalaryForm from "./SalaryForm";
import ResultPanel from "./ResultPanel";

export const DEFAULT_SALARY_INPUT: CalculatorInput = {
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
};

interface SalaryCalculatorProps {
  input: CalculatorInput;
  setInput: React.Dispatch<React.SetStateAction<CalculatorInput>>;
}

export default function SalaryCalculator({ input, setInput }: SalaryCalculatorProps) {
  const [resultView, setResultView] = useState<Frequency>("monthly");
  const result = useMemo(() => calculate(input), [input]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="lg:col-span-2">
        <SalaryForm input={input} setInput={setInput} />
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
