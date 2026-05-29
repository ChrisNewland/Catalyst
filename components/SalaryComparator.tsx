"use client";

import { useState } from "react";
import type { CalculatorInput } from "@/lib/tax";
import SalaryForm from "./SalaryForm";
import ComparatorPanel from "./ComparatorPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";

interface Props {
  inputA: CalculatorInput;
  setInputA: React.Dispatch<React.SetStateAction<CalculatorInput>>;
  inputB: CalculatorInput;
  setInputB: React.Dispatch<React.SetStateAction<CalculatorInput>>;
  nameA?: string;
  nameB?: string;
}

export default function SalaryComparator({
  inputA,
  setInputA,
  inputB,
  setInputB,
  nameA = "Scenario A",
  nameB = "Scenario B",
}: Props) {
  const [active, setActive] = useState<"A" | "B">("A");

  function swap() {
    const a = inputA;
    setInputA(inputB);
    setInputB(a);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between gap-2">
          <Tabs value={active} onValueChange={(v) => setActive(v as "A" | "B")} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="A">{nameA}</TabsTrigger>
              <TabsTrigger value="B">{nameB}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" onClick={swap} aria-label="Swap A and B" title="Swap A and B">
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>
        {/** Keep both forms mounted so input focus / selection survives tab switches. */}
        <div className={active === "A" ? "block" : "hidden"}>
          <SalaryForm input={inputA} setInput={setInputA} idPrefix="a-" />
        </div>
        <div className={active === "B" ? "block" : "hidden"}>
          <SalaryForm input={inputB} setInput={setInputB} idPrefix="b-" />
        </div>
      </section>

      <section className="lg:col-span-3">
        <ComparatorPanel inputA={inputA} inputB={inputB} nameA={nameA} nameB={nameB} />
      </section>
    </div>
  );
}
