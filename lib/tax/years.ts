import type { TaxYear, TaxYearConfig } from "./types";

/** Single source of truth for HMRC thresholds, rates and allowances by tax year.
 *  Adding a new year is purely additive — append a new key with its config and
 *  no calculation code needs to change. */
export const TAX_YEARS: Record<TaxYear, TaxYearConfig> = {
  "2025-26": {
    label: "2025 / 2026",
    allowances: {
      personalAllowance: 12570,
      taperStart: 100000,
      taperEnd: 125140,
      taperRatio: 2,
      blindPersons: 3130,
      marriage: 1260,
    },
    incomeTax: {
      england: [
        { upTo: 37700, rate: 0.2, label: "Basic rate" },
        { upTo: 112570, rate: 0.4, label: "Higher rate" },
        { upTo: Infinity, rate: 0.45, label: "Additional rate" },
      ],
      scotland: [
        { upTo: 2827, rate: 0.19, label: "Starter rate" },
        { upTo: 14921, rate: 0.2, label: "Basic rate" },
        { upTo: 31092, rate: 0.21, label: "Intermediate rate" },
        { upTo: 62430, rate: 0.42, label: "Higher rate" },
        { upTo: 112570, rate: 0.45, label: "Advanced rate" },
        { upTo: Infinity, rate: 0.48, label: "Top rate" },
      ],
    },
    ni: {
      primaryThreshold: 12570,
      upperEarningsLimit: 50270,
      mainRate: 0.08,
      upperRate: 0.02,
    },
    statePensionAge: 66,
    studentLoans: {
      plan1: { threshold: 26065, rate: 0.09, label: "Plan 1" },
      plan2: { threshold: 28470, rate: 0.09, label: "Plan 2" },
      plan4: { threshold: 32745, rate: 0.09, label: "Plan 4" },
      plan5: { threshold: 25000, rate: 0.09, label: "Plan 5" },
      postgrad: { threshold: 21000, rate: 0.06, label: "Postgrad" },
    },
    childcareVouchers: { monthlyCap: 243 },
    pensionRelief: { rasEmployeeFraction: 0.8 },
    secondJob: { defaultCode: "BR" },
  },
  "2024-25": {
    label: "2024 / 2025",
    allowances: {
      personalAllowance: 12570,
      taperStart: 100000,
      taperEnd: 125140,
      taperRatio: 2,
      blindPersons: 3070,
      marriage: 1260,
    },
    incomeTax: {
      england: [
        { upTo: 37700, rate: 0.2, label: "Basic rate" },
        { upTo: 112570, rate: 0.4, label: "Higher rate" },
        { upTo: Infinity, rate: 0.45, label: "Additional rate" },
      ],
      scotland: [
        { upTo: 2162, rate: 0.19, label: "Starter rate" },
        { upTo: 13118, rate: 0.2, label: "Basic rate" },
        { upTo: 31092, rate: 0.21, label: "Intermediate rate" },
        { upTo: 62430, rate: 0.42, label: "Higher rate" },
        { upTo: 112570, rate: 0.45, label: "Advanced rate" },
        { upTo: Infinity, rate: 0.48, label: "Top rate" },
      ],
    },
    ni: {
      primaryThreshold: 12570,
      upperEarningsLimit: 50270,
      mainRate: 0.08,
      upperRate: 0.02,
    },
    statePensionAge: 66,
    studentLoans: {
      plan1: { threshold: 24990, rate: 0.09, label: "Plan 1" },
      plan2: { threshold: 27295, rate: 0.09, label: "Plan 2" },
      plan4: { threshold: 31395, rate: 0.09, label: "Plan 4" },
      plan5: { threshold: 25000, rate: 0.09, label: "Plan 5" },
      postgrad: { threshold: 21000, rate: 0.06, label: "Postgrad" },
    },
    childcareVouchers: { monthlyCap: 243 },
    pensionRelief: { rasEmployeeFraction: 0.8 },
    secondJob: { defaultCode: "BR" },
  },
};
