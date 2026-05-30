/**
 * Parity test against HMRC-correct reference values — the same numbers
 * thesalarycalculator.co.uk publishes for the equivalent inputs.
 *
 * Each scenario is hand-computed from the published 2025/26 thresholds.
 * Any divergence here means the engine has drifted from the law, *not*
 * that the reference values are stale (re-derive them from HMRC publications
 * when thresholds change).
 */
import { describe, it, expect } from "vitest";
import { calculate, type CalculatorInput } from "../lib/tax";

function base(over: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    taxYear: "2025-26",
    grossInput: 30000,
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
    pensionContribution: 0,
    childcareVouchersMonthly: 0,
    taxableBenefits: 0,
    studentLoans: [],
    ...over,
  };
}

interface Expected {
  tax: number;
  ni: number;
  sl?: number;
  takeHome: number;
}

const scenarios: { name: string; input: CalculatorInput; expected: Expected }[] = [
  /** Basic-rate-only, no extras — simplest case. */
  {
    name: "£20,000 England (basic rate)",
    input: base({ grossInput: 20000 }),
    expected: { tax: 1486, ni: 594.4, takeHome: 17919.6 },
  },
  /** Classic mid-salary baseline. */
  {
    name: "£30,000 England (basic rate)",
    input: base({ grossInput: 30000 }),
    expected: { tax: 3486, ni: 1394.4, takeHome: 25119.6 },
  },
  /** Just below the higher-rate threshold — entire taxable slice at 20%. */
  {
    name: "£50,000 England (just below higher rate)",
    input: base({ grossInput: 50000 }),
    expected: { tax: 7486, ni: 2994.4, takeHome: 39519.6 },
  },
  /** First higher-rate scenario; NI also crosses the upper earnings limit. */
  {
    name: "£60,000 England (higher rate + NI UEL crossed)",
    input: base({ grossInput: 60000 }),
    expected: { tax: 11432, ni: 3210.6, takeHome: 45357.4 },
  },
  /** Hits the £100k mark — PA still in full. */
  {
    name: "£100,000 England (PA not yet tapered)",
    input: base({ grossInput: 100000 }),
    expected: { tax: 27432, ni: 4010.6, takeHome: 68557.4 },
  },
  /** Above £125,140 — personal allowance fully tapered to zero. */
  {
    name: "£130,000 England (PA fully removed)",
    input: base({ grossInput: 130000 }),
    expected: { tax: 45331.5, ni: 4610.6, takeHome: 80057.9 },
  },
  /** Scottish bands — same gross, different income tax. */
  {
    name: "£30,000 Scotland (starter + basic + intermediate)",
    input: base({ grossInput: 30000, region: "scotland" }),
    expected: { tax: 3482.82, ni: 1394.4, takeHome: 25122.78 },
  },
  /** Auto-enrolment pension reduces taxable income but not NI. */
  {
    name: "£30,000 + 5% auto-enrolment pension",
    input: base({ grossInput: 30000, pensionType: "auto", pensionContribution: 5 }),
    expected: { tax: 3186, ni: 1394.4, takeHome: 23919.6 },
  },
  /** Plan 2 student loan — 9% above £28,470 threshold, floored to nearest £. */
  {
    name: "£30,000 + Plan 2 student loan",
    input: base({ grossInput: 30000, studentLoans: ["plan2"] }),
    expected: { tax: 3486, ni: 1394.4, sl: 137, takeHome: 24982.6 },
  },
  /** The scenario that drove this PR — salary sacrifice reduces the SL base too. */
  {
    name: "£88,000 + Plan 2 + 5% salary sacrifice",
    input: base({
      grossInput: 88000,
      pensionType: "salarySacrifice",
      pensionContribution: 5,
      studentLoans: ["plan2"],
    }),
    expected: { tax: 20872, ni: 3682.6, sl: 4961, takeHome: 54084.4 },
  },
];

describe("parity with thesalarycalculator.co.uk reference values", () => {
  for (const { name, input, expected } of scenarios) {
    it(name, () => {
      const r = calculate(input);
      expect(r.incomeTax, "income tax").toBeCloseTo(expected.tax, 1);
      expect(r.nationalInsurance, "national insurance").toBeCloseTo(expected.ni, 1);
      if (expected.sl !== undefined) {
        expect(r.studentLoan, "student loan").toBe(expected.sl);
      }
      expect(r.takeHome, "take-home").toBeCloseTo(expected.takeHome, 1);
    });
  }
});
