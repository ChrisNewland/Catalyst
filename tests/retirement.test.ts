import { describe, it, expect } from "vitest";
import {
  projectRetirement,
  projectPot,
  pensionContributionFromSalary,
  DEFAULT_RETIREMENT_INPUT,
  type RetirementInput,
} from "../lib/retirement";

function base(over: Partial<RetirementInput> = {}): RetirementInput {
  return { ...DEFAULT_RETIREMENT_INPUT, ...over };
}

describe("projectPot", () => {
  it("returns initial when years is zero", () => {
    expect(projectPot(1000, 100, 0, 0.05)).toBe(1000);
  });
  it("compounds initial and contributions", () => {
    /** £1,000 @ 10% for 1 yr = £1,100; plus £100 contribution = £1,200 */
    expect(projectPot(1000, 100, 1, 0.1)).toBeCloseTo(1200, 4);
  });
  it("handles zero-return without dividing by zero", () => {
    expect(projectPot(1000, 100, 5, 0)).toBe(1500);
  });
  it("grows £10k for 30 years at 5%", () => {
    /** 10000 × 1.05^30 = ~43,219 */
    expect(projectPot(10000, 0, 30, 0.05)).toBeCloseTo(43219.42, 0);
  });
});

describe("FIRE number", () => {
  it("£30k spend / 3.5% SWR = £857,143", () => {
    const p = projectRetirement(base({ annualSpend: 30000, swr: 0.035 }));
    expect(p.fireNumber).toBeCloseTo(857142.86, 0);
  });
  it("4% rule lowers the FIRE number", () => {
    const p3 = projectRetirement(base({ annualSpend: 30000, swr: 0.035 }));
    const p4 = projectRetirement(base({ annualSpend: 30000, swr: 0.04 }));
    expect(p4.fireNumber).toBeLessThan(p3.fireNumber);
  });
  it("state pension offsets the post-state-pension FIRE number", () => {
    const p = projectRetirement(base({ annualSpend: 30000, swr: 0.035, statePensionAnnual: 11973 }));
    /** Offset spend = 30000 - 11973 = 18027; FIRE-with-SP = 18027 / 0.035 ≈ £515,057 */
    expect(p.fireNumberWithStatePension).toBeCloseTo(515057.14, 0);
    expect(p.fireNumberWithStatePension).toBeLessThan(p.fireNumber);
  });
});

describe("Coast FIRE", () => {
  it("calculates coast-FIRE-today as fireNumber discounted by years to target", () => {
    /** FIRE = 30k / 0.035 ≈ 857k; 30 years @ 5% real → coast today = 857k / 1.05^30 ≈ £198k */
    const p = projectRetirement(base({ currentAge: 30, targetRetirementAge: 60, annualSpend: 30000, realReturnRate: 0.05, swr: 0.035 }));
    expect(p.coastFireToday).toBeCloseTo(857142.86 / Math.pow(1.05, 30), 0);
  });

  it("returns a coast age when the user can stop contributing partway through", () => {
    /** With a healthy starting pot, stopping at some age before target should hit FIRE. */
    const p = projectRetirement(base({ currentAge: 30, targetRetirementAge: 60, currentPensionPot: 100000, currentIsaPot: 50000, annualPensionContribution: 8000, annualIsaContribution: 4000 }));
    expect(p.coastFireAge).not.toBeNull();
    expect(p.coastFireAge).toBeGreaterThanOrEqual(30);
    expect(p.coastFireAge).toBeLessThanOrEqual(60);
  });

  it("flags canCoastNow when present pots already cover the future FIRE number", () => {
    /** Massive starting pot → already coasting. */
    const p = projectRetirement(base({ currentAge: 30, targetRetirementAge: 60, currentPensionPot: 500000, currentIsaPot: 500000 }));
    expect(p.canCoastNow).toBe(true);
    expect(p.coastFireAge).toBe(30);
  });

  it("returns null coast age when target is unreachable at current contribution rate", () => {
    const p = projectRetirement(base({ currentAge: 30, targetRetirementAge: 35, currentPensionPot: 0, currentIsaPot: 0, annualPensionContribution: 1000, annualIsaContribution: 0, annualSpend: 100000 }));
    expect(p.coastFireAge).toBeNull();
  });
});

describe("yearly projection", () => {
  it("projects 61 yearly points from age 30 to 90", () => {
    const p = projectRetirement(base({ currentAge: 30 }));
    expect(p.yearly.length).toBe(61);
    expect(p.yearly[0].age).toBe(30);
    expect(p.yearly.at(-1)!.age).toBe(90);
  });

  it("marks years before target as accumulating and after as drawing", () => {
    const p = projectRetirement(base({ currentAge: 30, targetRetirementAge: 60 }));
    expect(p.yearly.find((y) => y.age === 59)!.drawing).toBe(false);
    expect(p.yearly.find((y) => y.age === 60)!.drawing).toBe(true);
  });

  it("ISA bridges spend before pension access age — pension grows untouched", () => {
    /** Retire at 55, pension locked until 57 — those two years must draw from ISA only.
     *  Pension should grow at the full real-return rate (no withdrawals). */
    const r = 0.05;
    const p = projectRetirement(
      base({
        currentAge: 30,
        targetRetirementAge: 55,
        pensionAccessAge: 57,
        annualSpend: 30000,
        currentPensionPot: 200000,
        currentIsaPot: 100000,
        annualPensionContribution: 10000,
        annualIsaContribution: 8000,
        realReturnRate: r,
      }),
    );
    const p55 = p.yearly.find((y) => y.age === 55)!;
    const p56 = p.yearly.find((y) => y.age === 56)!;
    /** Pension at 56 should be exactly pension at 55 × (1+r) — no withdrawals taken. */
    expect(p56.pension).toBeCloseTo(p55.pension * (1 + r), 2);
    /** ISA grew, then £30k was withdrawn — net should be p55.isa × (1+r) - 30000. */
    expect(p56.isa).toBeCloseTo(p55.isa * (1 + r) - 30000, 2);
  });
});

describe("bridge gap warning", () => {
  it("flags bridge years when retiring before pension access age", () => {
    const p = projectRetirement(base({ targetRetirementAge: 52, pensionAccessAge: 57, annualSpend: 30000 }));
    expect(p.bridgeGapYears).toBe(5);
    expect(p.bridgeFundsNeeded).toBe(150000);
  });

  it("no bridge required when retiring after pension access age", () => {
    const p = projectRetirement(base({ targetRetirementAge: 60, pensionAccessAge: 57 }));
    expect(p.bridgeGapYears).toBe(0);
    expect(p.bridgeShortfall).toBe(0);
  });

  it("reports zero shortfall when ISA pot covers the bridge", () => {
    const p = projectRetirement(
      base({ targetRetirementAge: 55, pensionAccessAge: 57, annualSpend: 30000, currentIsaPot: 500000, annualIsaContribution: 0 }),
    );
    expect(p.bridgeShortfall).toBe(0);
  });
});

describe("pensionContributionFromSalary", () => {
  it("computes percentage contributions from gross", () => {
    expect(
      pensionContributionFromSalary({ annualGross: 60000, pensionMode: "percent", pensionContribution: 5, pensionType: "auto" }),
    ).toBe(3000);
  });
  it("passes through fixed amounts", () => {
    expect(
      pensionContributionFromSalary({ annualGross: 60000, pensionMode: "amount", pensionContribution: 4500, pensionType: "auto" }),
    ).toBe(4500);
  });
  it("returns zero for employer-only pensions", () => {
    expect(
      pensionContributionFromSalary({ annualGross: 60000, pensionMode: "percent", pensionContribution: 8, pensionType: "employer" }),
    ).toBe(0);
  });
});
