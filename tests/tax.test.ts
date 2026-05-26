import { describe, it, expect } from "vitest";
import { calculate, parseTaxCode, annualiseGross, CalculatorInput } from "../lib/tax";

function base(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    grossInput: 30000,
    frequency: "yearly",
    hoursPerWeek: 37.5,
    daysPerWeek: 5,
    taxCode: "1257L",
    region: "england",
    age: 30,
    blindAllowance: false,
    pensionMode: "percent",
    pensionContribution: 0,
    studentLoans: [],
    ...overrides,
  };
}

describe("annualiseGross", () => {
  it("passes through yearly", () => {
    expect(annualiseGross(base({ grossInput: 30000, frequency: "yearly" }))).toBe(30000);
  });
  it("multiplies monthly", () => {
    expect(annualiseGross(base({ grossInput: 2500, frequency: "monthly" }))).toBe(30000);
  });
  it("multiplies weekly", () => {
    expect(annualiseGross(base({ grossInput: 500, frequency: "weekly" }))).toBe(26000);
  });
  it("multiplies hourly by hours × 52", () => {
    expect(
      annualiseGross(base({ grossInput: 15, frequency: "hourly", hoursPerWeek: 40 })),
    ).toBe(31200);
  });
});

describe("parseTaxCode", () => {
  it("treats 1257L as standard personal allowance", () => {
    expect(parseTaxCode("1257L").allowance).toBe(12570);
  });
  it("treats BR as zero allowance, flat 20%", () => {
    const r = parseTaxCode("BR");
    expect(r.allowance).toBe(0);
    expect(r.flatRate).toBe(0.2);
  });
  it("treats K100 as a negative allowance", () => {
    expect(parseTaxCode("K100").allowance).toBe(-1000);
  });
  it("treats NT as no tax", () => {
    expect(parseTaxCode("NT").allowance).toBe(Infinity);
  });
});

describe("calculate — England", () => {
  it("returns zero tax/NI for £12,000 salary (below thresholds)", () => {
    const r = calculate(base({ grossInput: 12000 }));
    expect(r.incomeTax).toBe(0);
    expect(r.nationalInsurance).toBe(0);
    expect(r.takeHome).toBe(12000);
  });

  it("£30,000 salary — basic rate only", () => {
    const r = calculate(base({ grossInput: 30000 }));
    /** Taxable: 30000 - 12570 = 17430 @ 20% = 3486 */
    expect(r.incomeTax).toBeCloseTo(3486, 2);
    /** NI: (30000 - 12570) × 8% = 1394.40 */
    expect(r.nationalInsurance).toBeCloseTo(1394.4, 2);
    expect(r.takeHome).toBeCloseTo(30000 - 3486 - 1394.4, 2);
  });

  it("£60,000 salary — crosses into higher rate", () => {
    const r = calculate(base({ grossInput: 60000 }));
    /** Basic: (50270 - 12570) × 20% = 7540. Higher: (60000 - 50270) × 40% = 3892. Total = 11432 */
    expect(r.incomeTax).toBeCloseTo(11432, 2);
    /** NI: (50270 - 12570) × 8% + (60000 - 50270) × 2% = 3016 + 194.60 = 3210.60 */
    expect(r.nationalInsurance).toBeCloseTo(3210.6, 2);
  });

  it("£110,000 — personal allowance starts tapering", () => {
    const r = calculate(base({ grossInput: 110000 }));
    /** PA reduced by (110000 - 100000) / 2 = 5000 → PA = 7570. */
    expect(r.personalAllowance).toBeCloseTo(7570, 2);
  });

  it("£130,000 — personal allowance fully removed", () => {
    const r = calculate(base({ grossInput: 130000 }));
    expect(r.personalAllowance).toBe(0);
  });
});

describe("calculate — Scotland", () => {
  it("£30,000 salary — Scottish bands", () => {
    const r = calculate(base({ grossInput: 30000, region: "scotland" }));
    /** Taxable = 17430. Bands above PA: starter 19% on 2827 (12570→15397) = 537.13,
     *  basic 20% on 12094 (15397→27491) = 2418.80, intermediate 21% on 2509 (27491→30000) = 526.89.
     *  Total ≈ 3482.82. */
    expect(r.incomeTax).toBeCloseTo(537.13 + 2418.8 + 526.89, 1);
  });
});

describe("calculate — pension & student loan", () => {
  it("5% pension on £30k reduces taxable income", () => {
    const r = calculate(base({ grossInput: 30000, pensionMode: "percent", pensionContribution: 5 }));
    expect(r.pension).toBeCloseTo(1500, 2);
    /** Taxable: 30000 - 1500 - 12570 = 15930 @ 20% = 3186 */
    expect(r.incomeTax).toBeCloseTo(3186, 2);
  });

  it("Plan 2 student loan on £35k", () => {
    const r = calculate(base({ grossInput: 35000, studentLoans: ["plan2"] }));
    /** (35000 - 28470) × 9% = 587.70, floored to 587. */
    expect(r.studentLoan).toBe(587);
  });

  it("BR code applies flat 20% with no allowance", () => {
    const r = calculate(base({ grossInput: 30000, taxCode: "BR" }));
    expect(r.incomeTax).toBeCloseTo(6000, 2);
  });

  it("over state-pension age pays no NI", () => {
    const r = calculate(base({ grossInput: 30000, age: 70 }));
    expect(r.nationalInsurance).toBe(0);
  });
});
