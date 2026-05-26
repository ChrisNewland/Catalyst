export type Region = "england" | "scotland";
export type Frequency = "yearly" | "monthly" | "weekly" | "daily" | "hourly";
export type PensionMode = "percent" | "amount";
/**
 * - auto: net-pay / auto-enrolment — reduces taxable income but not NI base.
 * - salarySacrifice: reduces both taxable and NI base.
 * - personalRas: paid from net pay; provider claims basic-rate relief, no effect on PAYE display.
 *   Higher/additional rate taxpayers can reclaim the difference via Self-Assessment.
 * - employer: paid by employer on top of salary; no effect on employee take-home.
 */
export type PensionType = "auto" | "salarySacrifice" | "personalRas" | "employer";
export type StudentLoanPlan = "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";
export type TaxYear = "2025-26" | "2024-25";

export interface CalculatorInput {
  taxYear: TaxYear;
  grossInput: number;
  frequency: Frequency;
  hoursPerWeek: number;
  daysPerWeek: number;
  /** Annual bonus, commission or other one-off income — taxed at marginal rate. */
  bonusAnnual: number;
  /** Hours per week of overtime (only meaningful when frequency is "hourly"). */
  overtimeHoursPerWeek: number;
  /** Multiplier of base hourly rate, e.g. 1.5x. */
  overtimeMultiplier: number;
  /** Annual gross from a separate employment — treated with a BR (basic rate) code. */
  secondJobAnnual: number;
  taxCode: string;
  region: Region;
  age: number;
  pensionMode: PensionMode;
  pensionType: PensionType;
  /** Either a percentage or an annual £ figure (per pensionMode). */
  pensionContribution: number;
  /** Pre-tax & pre-NI childcare voucher amount per month (legacy scheme, max £243). */
  childcareVouchersMonthly: number;
  /** Cash-equivalent of taxable benefits in kind (company car, medical etc). */
  taxableBenefits: number;
  studentLoans: StudentLoanPlan[];
  blindAllowance: boolean;
  /** Receiving a 10% PA transfer from a spouse. */
  marriageAllowance: boolean;
}

interface YearConfig {
  label: string;
  personalAllowance: number;
  paTaperStart: number;
  paTaperEnd: number;
  blindPersonsAllowance: number;
  marriageAllowance: number;
  england: { upTo: number; rate: number; label: string }[];
  scotland: { upTo: number; rate: number; label: string }[];
  ni: { pt: number; uel: number; mainRate: number; upperRate: number };
  statePensionAge: number;
  studentLoans: Record<StudentLoanPlan, { threshold: number; rate: number; label: string }>;
}

/** All band thresholds are cumulative *widths above the personal allowance*,
 *  matching HMRC's published band sizes (basic-rate band: £37,700, etc.). */
export const TAX_YEARS: Record<TaxYear, YearConfig> = {
  "2025-26": {
    label: "2025 / 2026",
    personalAllowance: 12570,
    paTaperStart: 100000,
    paTaperEnd: 125140,
    blindPersonsAllowance: 3130,
    marriageAllowance: 1260,
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
    ni: { pt: 12570, uel: 50270, mainRate: 0.08, upperRate: 0.02 },
    statePensionAge: 66,
    studentLoans: {
      plan1: { threshold: 26065, rate: 0.09, label: "Plan 1" },
      plan2: { threshold: 28470, rate: 0.09, label: "Plan 2" },
      plan4: { threshold: 32745, rate: 0.09, label: "Plan 4" },
      plan5: { threshold: 25000, rate: 0.09, label: "Plan 5" },
      postgrad: { threshold: 21000, rate: 0.06, label: "Postgrad" },
    },
  },
  "2024-25": {
    label: "2024 / 2025",
    personalAllowance: 12570,
    paTaperStart: 100000,
    paTaperEnd: 125140,
    blindPersonsAllowance: 3070,
    marriageAllowance: 1260,
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
    ni: { pt: 12570, uel: 50270, mainRate: 0.08, upperRate: 0.02 },
    statePensionAge: 66,
    studentLoans: {
      plan1: { threshold: 24990, rate: 0.09, label: "Plan 1" },
      plan2: { threshold: 27295, rate: 0.09, label: "Plan 2" },
      plan4: { threshold: 31395, rate: 0.09, label: "Plan 4" },
      plan5: { threshold: 25000, rate: 0.09, label: "Plan 5" },
      postgrad: { threshold: 21000, rate: 0.06, label: "Postgrad" },
    },
  },
};

export const CHILDCARE_VOUCHER_MAX_MONTHLY = 243;

export interface Breakdown {
  /** Total annual gross including base + overtime + bonus (excluding second job). */
  gross: number;
  baseSalary: number;
  overtime: number;
  bonus: number;
  secondJob: number;
  taxableIncome: number;
  personalAllowance: number;
  incomeTax: number;
  incomeTaxMain: number;
  incomeTaxSecondJob: number;
  nationalInsurance: number;
  nationalInsuranceMain: number;
  nationalInsuranceSecondJob: number;
  /** Pension cost to the employee — excludes employer contribution. */
  pension: number;
  /** Higher/additional-rate relief reclaimable via SA for RAS pensions. */
  pensionExtraRelief: number;
  studentLoan: number;
  childcareVouchers: number;
  taxableBenefits: number;
  takeHome: number;
  taxBands: { label: string; rate: number; amount: number; tax: number }[];
  effectiveTaxRate: number;
  marginalRate: number;
}

export function annualiseGross(input: CalculatorInput): number {
  const v = Math.max(0, input.grossInput || 0);
  switch (input.frequency) {
    case "yearly":
      return v;
    case "monthly":
      return v * 12;
    case "weekly":
      return v * 52;
    case "daily":
      return v * Math.max(0, input.daysPerWeek) * 52;
    case "hourly":
      return v * Math.max(0, input.hoursPerWeek) * 52;
  }
}

function annualiseOvertime(input: CalculatorInput): number {
  if (input.frequency !== "hourly") return 0;
  const base = Math.max(0, input.grossInput || 0);
  return (
    base *
    Math.max(0, input.overtimeMultiplier || 0) *
    Math.max(0, input.overtimeHoursPerWeek || 0) *
    52
  );
}

export function parseTaxCode(code: string, personalAllowance: number): { allowance: number; flatRate?: number } {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { allowance: personalAllowance };
  if (c === "NT") return { allowance: Infinity };
  if (c === "BR") return { allowance: 0, flatRate: 0.2 };
  if (c === "D0") return { allowance: 0, flatRate: 0.4 };
  if (c === "D1") return { allowance: 0, flatRate: 0.45 };
  const kMatch = c.match(/^K(\d+)/);
  if (kMatch) return { allowance: -parseInt(kMatch[1], 10) * 10 };
  const nMatch = c.match(/^(\d+)/);
  if (nMatch) return { allowance: parseInt(nMatch[1], 10) * 10 };
  return { allowance: personalAllowance };
}

function calcBandedTax(
  taxable: number,
  bands: { upTo: number; rate: number; label: string }[],
  flatRate?: number,
): { total: number; bands: Breakdown["taxBands"] } {
  if (taxable <= 0) return { total: 0, bands: [] };
  if (flatRate !== undefined) {
    return {
      total: taxable * flatRate,
      bands: [{ label: `Flat ${(flatRate * 100).toFixed(0)}%`, rate: flatRate, amount: taxable, tax: taxable * flatRate }],
    };
  }
  let remaining = taxable;
  let lastUpper = 0;
  let total = 0;
  const out: Breakdown["taxBands"] = [];
  for (const band of bands) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, band.upTo - lastUpper);
    const tax = slice * band.rate;
    if (slice > 0) {
      out.push({ label: band.label, rate: band.rate, amount: slice, tax });
      total += tax;
    }
    remaining -= slice;
    lastUpper = band.upTo;
  }
  return { total, bands: out };
}

function calcNI(annualNIable: number, age: number, year: YearConfig): number {
  if (age >= year.statePensionAge) return 0;
  const { pt, uel, mainRate, upperRate } = year.ni;
  if (annualNIable <= pt) return 0;
  const mainBand = Math.min(annualNIable, uel) - pt;
  const upperBand = Math.max(0, annualNIable - uel);
  return mainBand * mainRate + upperBand * upperRate;
}

function calcStudentLoan(annualGross: number, plans: StudentLoanPlan[], year: YearConfig): number {
  let total = 0;
  for (const p of plans) {
    const plan = year.studentLoans[p];
    if (annualGross > plan.threshold) {
      total += (annualGross - plan.threshold) * plan.rate;
    }
  }
  return Math.floor(total);
}

function pensionAmount(input: CalculatorInput, baseFor: number): number {
  if (input.pensionType === "employer") return 0;
  return input.pensionMode === "percent"
    ? baseFor * Math.max(0, input.pensionContribution) / 100
    : Math.max(0, input.pensionContribution);
}

export function calculate(input: CalculatorInput): Breakdown {
  const year = TAX_YEARS[input.taxYear];
  const codeInfo = parseTaxCode(input.taxCode, year.personalAllowance);

  const baseSalary = annualiseGross(input);
  const overtime = annualiseOvertime(input);
  const bonus = Math.max(0, input.bonusAnnual || 0);
  const secondJob = Math.max(0, input.secondJobAnnual || 0);
  const grossPrimary = baseSalary + overtime + bonus;
  const totalGross = grossPrimary + secondJob;

  /** Pension contribution sized off primary gross (industry convention — not the second job). */
  const pension = pensionAmount(input, grossPrimary);
  const childcare = Math.max(0, Math.min(input.childcareVouchersMonthly || 0, CHILDCARE_VOUCHER_MAX_MONTHLY)) * 12;
  const bik = Math.max(0, input.taxableBenefits || 0);

  /** Build the taxable & NIable bases for the primary employment. */
  let taxableBase = grossPrimary;
  let niableBase = grossPrimary;

  if (input.pensionType === "salarySacrifice") {
    taxableBase -= pension;
    niableBase -= pension;
  } else if (input.pensionType === "auto") {
    /** Net-pay arrangement: reduces taxable, NI still calculated on full gross. */
    taxableBase -= pension;
  }
  /** Childcare vouchers (legacy scheme) — pre-tax and pre-NI. */
  taxableBase -= childcare;
  niableBase -= childcare;
  /** Benefits-in-kind add to taxable income (cash-equivalent), no employee NI cost. */
  taxableBase += bik;

  /** Personal allowance with high-income tapering, blind & marriage allowances. */
  let pa = codeInfo.allowance;
  if (Number.isFinite(pa) && pa > 0) {
    if (taxableBase > year.paTaperStart) {
      const reduction = Math.min(pa, (taxableBase - year.paTaperStart) / 2);
      pa = Math.max(0, pa - reduction);
    }
    if (input.blindAllowance) pa += year.blindPersonsAllowance;
    if (input.marriageAllowance) pa += year.marriageAllowance;
  } else if (input.blindAllowance) {
    pa = Math.max(pa, 0) + year.blindPersonsAllowance;
  }

  const taxableAfterPa = Number.isFinite(pa) ? Math.max(0, taxableBase - pa) : 0;
  const regionBands = input.region === "scotland" ? year.scotland : year.england;
  const mainTax = calcBandedTax(taxableAfterPa, regionBands, codeInfo.flatRate);

  /** Second job: BR PAYE code — all earnings taxed at 20%, own NI thresholds. */
  const secondTax = secondJob * 0.2;
  const niMain = calcNI(niableBase, input.age, year);
  const niSecond = calcNI(secondJob, input.age, year);

  /** Student loans assessed on combined earnings. */
  const studentLoan = calcStudentLoan(grossPrimary + secondJob, input.studentLoans, year);

  /** Employee pension cost depends on type. */
  let employeePension = 0;
  let pensionExtraRelief = 0;
  if (input.pensionType === "salarySacrifice" || input.pensionType === "auto") {
    employeePension = pension;
  } else if (input.pensionType === "personalRas") {
    /** RAS: employee pays 80%, provider grosses up to 100% via basic-rate relief. */
    employeePension = pension * 0.8;
    /** Higher/additional-rate taxpayers can reclaim an extra 20% or 25% via Self-Assessment. */
    if (taxableAfterPa > 37700) {
      const higherSlice = Math.max(0, Math.min(pension, taxableAfterPa - 37700));
      pensionExtraRelief = higherSlice * 0.2;
      if (taxableAfterPa > 112570) {
        const additionalSlice = Math.max(0, Math.min(pension, taxableAfterPa - 112570));
        pensionExtraRelief += additionalSlice * 0.05;
      }
    }
  }

  const incomeTax = mainTax.total + secondTax;
  const ni = niMain + niSecond;
  const cashFromMain = grossPrimary - mainTax.total - niMain - employeePension - childcare;
  const cashFromSecond = secondJob - secondTax - niSecond;
  const takeHome = cashFromMain + cashFromSecond - studentLoan;

  return {
    gross: grossPrimary,
    baseSalary,
    overtime,
    bonus,
    secondJob,
    taxableIncome: taxableAfterPa,
    personalAllowance: Number.isFinite(pa) ? Math.max(0, pa) : 0,
    incomeTax,
    incomeTaxMain: mainTax.total,
    incomeTaxSecondJob: secondTax,
    nationalInsurance: ni,
    nationalInsuranceMain: niMain,
    nationalInsuranceSecondJob: niSecond,
    pension: employeePension,
    pensionExtraRelief,
    studentLoan,
    childcareVouchers: childcare,
    taxableBenefits: bik,
    takeHome,
    taxBands: mainTax.bands,
    effectiveTaxRate: totalGross > 0 ? (incomeTax + ni) / totalGross : 0,
    marginalRate: marginalRateFor(taxableBase, taxableAfterPa, input.region, year, codeInfo.flatRate),
  };
}

function marginalRateFor(
  taxableBase: number,
  taxableAfterPa: number,
  region: Region,
  year: YearConfig,
  flatRate?: number,
): number {
  const niRate =
    taxableBase > year.ni.uel
      ? year.ni.upperRate
      : taxableBase > year.ni.pt
        ? year.ni.mainRate
        : 0;
  if (flatRate !== undefined) return flatRate + niRate;
  /** 60% trap: PA taper between £100k and £125,140 effectively doubles the higher-rate slice. */
  if (taxableBase > year.paTaperStart && taxableBase <= year.paTaperEnd) return 0.6 + niRate;
  const bands = region === "scotland" ? year.scotland : year.england;
  let rate = bands[bands.length - 1].rate;
  for (const band of bands) {
    if (taxableAfterPa <= band.upTo) {
      rate = band.rate;
      break;
    }
  }
  return rate + niRate;
}

export function inFrequency(annual: number, frequency: Frequency, input: { hoursPerWeek: number; daysPerWeek: number }): number {
  switch (frequency) {
    case "yearly":
      return annual;
    case "monthly":
      return annual / 12;
    case "weekly":
      return annual / 52;
    case "daily":
      return annual / 52 / Math.max(1, input.daysPerWeek);
    case "hourly":
      return annual / 52 / Math.max(1, input.hoursPerWeek);
  }
}
