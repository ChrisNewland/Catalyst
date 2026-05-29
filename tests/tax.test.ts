import { describe, it, expect } from "vitest";
import { calculate, parseTaxCode, annualiseGross, TAX_YEARS, CalculatorInput } from "../lib/tax";

const Y = TAX_YEARS["2025-26"];

function base(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
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
    expect(parseTaxCode("1257L", Y).allowance).toBe(12570);
  });
  it("treats BR as zero allowance, flat 20% sourced from year bands", () => {
    const r = parseTaxCode("BR", Y);
    expect(r.allowance).toBe(0);
    expect(r.flatRate).toBe(Y.incomeTax.england[0].rate);
  });
  it("treats D0 as flat higher rate from year bands", () => {
    const r = parseTaxCode("D0", Y);
    expect(r.flatRate).toBe(Y.incomeTax.england[1].rate);
  });
  it("treats K100 as a negative allowance", () => {
    expect(parseTaxCode("K100", Y).allowance).toBe(-1000);
  });
  it("treats NT as no tax", () => {
    expect(parseTaxCode("NT", Y).allowance).toBe(Infinity);
  });
});

describe("calculate — England core bands", () => {
  it("returns zero tax/NI for £12,000 salary", () => {
    const r = calculate(base({ grossInput: 12000 }));
    expect(r.incomeTax).toBe(0);
    expect(r.nationalInsurance).toBe(0);
    expect(r.takeHome).toBe(12000);
  });

  it("£30,000 — basic rate only", () => {
    const r = calculate(base({ grossInput: 30000 }));
    expect(r.incomeTax).toBeCloseTo(3486, 2);
    expect(r.nationalInsurance).toBeCloseTo(1394.4, 2);
  });

  it("£60,000 — crosses into higher rate", () => {
    const r = calculate(base({ grossInput: 60000 }));
    expect(r.incomeTax).toBeCloseTo(11432, 2);
    expect(r.nationalInsurance).toBeCloseTo(3210.6, 2);
  });

  it("£130,000 — personal allowance fully removed", () => {
    const r = calculate(base({ grossInput: 130000 }));
    expect(r.personalAllowance).toBe(0);
  });
});

describe("calculate — Scotland 2025/26", () => {
  it("£30,000 salary — Scottish bands", () => {
    const r = calculate(base({ grossInput: 30000, region: "scotland" }));
    expect(r.incomeTax).toBeCloseTo(537.13 + 2418.8 + 526.89, 1);
  });
});

describe("calculate — pension types", () => {
  it("5% auto-enrolment on £30k reduces taxable income but not NI", () => {
    const r = calculate(base({ grossInput: 30000, pensionType: "auto", pensionMode: "percent", pensionContribution: 5 }));
    expect(r.pension).toBeCloseTo(1500, 2);
    expect(r.incomeTax).toBeCloseTo(3186, 2);
    /** NI unchanged — assessed on the full £30k */
    expect(r.nationalInsurance).toBeCloseTo(1394.4, 2);
  });

  it("salary sacrifice on £30k reduces both tax and NI base", () => {
    const r = calculate(base({ grossInput: 30000, pensionType: "salarySacrifice", pensionMode: "percent", pensionContribution: 5 }));
    expect(r.pension).toBeCloseTo(1500, 2);
    expect(r.incomeTax).toBeCloseTo(3186, 2);
    /** NI on (30000 - 1500) - 12570 = 15930 × 8% = 1274.40 */
    expect(r.nationalInsurance).toBeCloseTo(1274.4, 2);
  });

  it("RAS pension paid from net (employee pays 80%)", () => {
    const r = calculate(base({ grossInput: 30000, pensionType: "personalRas", pensionMode: "amount", pensionContribution: 1000 }));
    /** Employee out-of-pocket: £800 (provider grosses up to £1,000) */
    expect(r.pension).toBeCloseTo(800, 2);
    /** Tax unchanged by RAS for basic-rate taxpayer */
    expect(r.incomeTax).toBeCloseTo(3486, 2);
  });

  it("RAS pension at higher rate generates reclaimable relief", () => {
    const r = calculate(base({ grossInput: 80000, pensionType: "personalRas", pensionMode: "amount", pensionContribution: 5000 }));
    /** Higher-rate band relief: 20% × 5000 = £1,000 reclaimable */
    expect(r.pensionExtraRelief).toBeCloseTo(1000, 2);
  });

  it("employer pension does not affect employee take-home", () => {
    const a = calculate(base({ grossInput: 30000, pensionType: "auto", pensionContribution: 0 }));
    const b = calculate(base({ grossInput: 30000, pensionType: "employer", pensionContribution: 8 }));
    expect(a.takeHome).toBe(b.takeHome);
  });
});

describe("calculate — bonus & overtime", () => {
  it("bonus added to gross is taxed at marginal rate", () => {
    const r = calculate(base({ grossInput: 30000, bonusAnnual: 5000 }));
    expect(r.gross).toBe(35000);
    /** Taxable: 35000 - 12570 = 22430 × 20% = 4486 */
    expect(r.incomeTax).toBeCloseTo(4486, 2);
  });

  it("overtime at 1.5x for hourly worker", () => {
    const r = calculate(
      base({
        grossInput: 15,
        frequency: "hourly",
        hoursPerWeek: 40,
        overtimeHoursPerWeek: 5,
        overtimeMultiplier: 1.5,
      }),
    );
    /** Base: 15 × 40 × 52 = 31200. Overtime: 15 × 1.5 × 5 × 52 = 5850. */
    expect(r.baseSalary).toBe(31200);
    expect(r.overtime).toBe(5850);
    expect(r.gross).toBe(37050);
  });

  it("overtime ignored for non-hourly frequency", () => {
    const r = calculate(base({ grossInput: 30000, frequency: "yearly", overtimeHoursPerWeek: 10 }));
    expect(r.overtime).toBe(0);
  });
});

describe("calculate — second job", () => {
  it("second job uses BR tax with no allowance and own NI thresholds", () => {
    const r = calculate(base({ grossInput: 30000, secondJobAnnual: 15000 }));
    /** Main: tax 3486, NI 1394.40. Second: 15000 × 20% = 3000 tax, NI on (15000-12570) = 2430 × 8% = 194.40 */
    expect(r.incomeTaxMain).toBeCloseTo(3486, 2);
    expect(r.incomeTaxSecondJob).toBeCloseTo(3000, 2);
    expect(r.nationalInsuranceMain).toBeCloseTo(1394.4, 2);
    expect(r.nationalInsuranceSecondJob).toBeCloseTo(194.4, 2);
  });

  it("two jobs at £15k each pay less NI than one job at £30k", () => {
    const single = calculate(base({ grossInput: 30000 }));
    const split = calculate(base({ grossInput: 15000, secondJobAnnual: 15000 }));
    expect(split.nationalInsurance).toBeLessThan(single.nationalInsurance);
  });
});

describe("calculate — childcare vouchers & BIK", () => {
  it("childcare vouchers reduce both tax and NI", () => {
    const without = calculate(base({ grossInput: 30000 }));
    const withCcv = calculate(base({ grossInput: 30000, childcareVouchersMonthly: 100 }));
    /** Reduces taxable+NIable by £1200/yr — saves ~20% tax + 8% NI = £336 */
    expect(withCcv.incomeTax).toBeLessThan(without.incomeTax);
    expect(withCcv.nationalInsurance).toBeLessThan(without.nationalInsurance);
    expect(without.incomeTax - withCcv.incomeTax).toBeCloseTo(240, 0);
    expect(without.nationalInsurance - withCcv.nationalInsurance).toBeCloseTo(96, 0);
  });

  it("childcare vouchers capped at £243/month", () => {
    const a = calculate(base({ grossInput: 30000, childcareVouchersMonthly: 243 }));
    const b = calculate(base({ grossInput: 30000, childcareVouchersMonthly: 500 }));
    expect(a.childcareVouchers).toBe(b.childcareVouchers);
  });

  it("taxable benefits (BIK) increase tax but not NI", () => {
    const r = calculate(base({ grossInput: 30000, taxableBenefits: 5000 }));
    /** Taxable rises by £5000 × 20% = £1000 extra tax. NI unchanged. */
    expect(r.incomeTax).toBeCloseTo(3486 + 1000, 2);
    expect(r.nationalInsurance).toBeCloseTo(1394.4, 2);
  });
});

describe("calculate — Marriage Allowance & Blind", () => {
  it("Marriage Allowance adds £1,260 to personal allowance", () => {
    const r = calculate(base({ grossInput: 30000, marriageAllowance: true }));
    expect(r.personalAllowance).toBe(12570 + 1260);
    /** Saves 20% × 1260 = £252 of tax */
    expect(r.incomeTax).toBeCloseTo(3486 - 252, 2);
  });

  it("Blind Person's Allowance adds £3,130", () => {
    const r = calculate(base({ grossInput: 30000, blindAllowance: true }));
    expect(r.personalAllowance).toBe(12570 + 3130);
  });
});

describe("student loan × pension interaction", () => {
  it("salary sacrifice reduces the student-loan assessable base", () => {
    /** £88k Plan 2 with 5% AE: SL = (88000 - 28470) × 9% = 5,357.70 → £5,357 */
    const ae = calculate(base({ grossInput: 88000, studentLoans: ["plan2"], pensionType: "auto", pensionContribution: 5 }));
    expect(ae.studentLoan).toBe(5357);
    /** With salary sacrifice, the sacrificed £4,400 is no longer "earnings":
     *  SL = (88000 - 4400 - 28470) × 9% = 4961.70 → £4,961 */
    const ss = calculate(base({ grossInput: 88000, studentLoans: ["plan2"], pensionType: "salarySacrifice", pensionContribution: 5 }));
    expect(ss.studentLoan).toBe(4961);
    expect(ae.studentLoan - ss.studentLoan).toBe(396);
  });

  it("RAS pension does not affect the student-loan base", () => {
    const ras = calculate(base({ grossInput: 88000, studentLoans: ["plan2"], pensionType: "personalRas", pensionContribution: 5 }));
    const ae = calculate(base({ grossInput: 88000, studentLoans: ["plan2"], pensionType: "auto", pensionContribution: 5 }));
    expect(ras.studentLoan).toBe(ae.studentLoan);
  });

  it("childcare-voucher salary sacrifice reduces the student-loan base", () => {
    const without = calculate(base({ grossInput: 88000, studentLoans: ["plan2"] }));
    const withCcv = calculate(base({ grossInput: 88000, studentLoans: ["plan2"], childcareVouchersMonthly: 100 }));
    /** Removing £1,200/yr from the SL base saves 9% × 1200 = £108 — but SL is floored. */
    expect(without.studentLoan - withCcv.studentLoan).toBeGreaterThanOrEqual(107);
    expect(without.studentLoan - withCcv.studentLoan).toBeLessThanOrEqual(108);
  });
});

describe("calculate — tax year switch", () => {
  it("2024/25 Scottish bands differ from 2025/26", () => {
    const a = calculate(base({ grossInput: 30000, region: "scotland", taxYear: "2025-26" }));
    const b = calculate(base({ grossInput: 30000, region: "scotland", taxYear: "2024-25" }));
    expect(a.incomeTax).not.toEqual(b.incomeTax);
  });

  it("2024/25 Plan 1 threshold is lower than 2025/26", () => {
    const a = calculate(base({ grossInput: 30000, studentLoans: ["plan1"], taxYear: "2025-26" }));
    const b = calculate(base({ grossInput: 30000, studentLoans: ["plan1"], taxYear: "2024-25" }));
    expect(b.studentLoan).toBeGreaterThan(a.studentLoan);
  });
});

describe("calculate — edge cases", () => {
  it("BR code applies flat 20%", () => {
    const r = calculate(base({ grossInput: 30000, taxCode: "BR" }));
    expect(r.incomeTax).toBeCloseTo(6000, 2);
  });

  it("over state-pension age pays no NI", () => {
    const r = calculate(base({ grossInput: 30000, age: 70 }));
    expect(r.nationalInsurance).toBe(0);
  });

  it("Plan 2 student loan on £35k", () => {
    const r = calculate(base({ grossInput: 35000, studentLoans: ["plan2"] }));
    expect(r.studentLoan).toBe(587);
  });

  it("£110,000 — personal allowance tapers", () => {
    const r = calculate(base({ grossInput: 110000 }));
    expect(r.personalAllowance).toBeCloseTo(7570, 2);
  });
});
