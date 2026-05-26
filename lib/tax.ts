export type Region = "england" | "scotland";
export type Frequency = "yearly" | "monthly" | "weekly" | "daily" | "hourly";
export type PensionMode = "percent" | "amount";
export type StudentLoanPlan = "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";

export interface CalculatorInput {
  /** Gross salary expressed in the chosen frequency. */
  grossInput: number;
  frequency: Frequency;
  /** Hours per week — only used when frequency is "hourly". */
  hoursPerWeek: number;
  /** Days per week — only used when frequency is "daily". */
  daysPerWeek: number;
  taxCode: string;
  region: Region;
  age: number;
  blindAllowance: boolean;
  pensionMode: PensionMode;
  /** When mode is "percent" this is a percentage of gross. When "amount", an annual £ figure. */
  pensionContribution: number;
  studentLoans: StudentLoanPlan[];
}

export interface Breakdown {
  gross: number;
  taxableIncome: number;
  personalAllowance: number;
  incomeTax: number;
  nationalInsurance: number;
  pension: number;
  studentLoan: number;
  takeHome: number;
  /** Income tax broken down by band, for display. */
  taxBands: { label: string; rate: number; amount: number; tax: number }[];
  effectiveTaxRate: number;
  marginalRate: number;
}

/** Tax year 2025/26 bands and thresholds. */
const PERSONAL_ALLOWANCE = 12570;
const PA_TAPER_START = 100000;
const PA_TAPER_END = 125140;

/** Bands are expressed as cumulative widths of *taxable* income (i.e. above the personal allowance).
 *  This matches how HMRC publishes them (basic-rate band: £37,700, etc.). */
const ENGLAND_BANDS = [
  { upTo: 37700, rate: 0.2, label: "Basic rate" },
  { upTo: 112570, rate: 0.4, label: "Higher rate" },
  { upTo: Infinity, rate: 0.45, label: "Additional rate" },
];

const SCOTLAND_BANDS = [
  { upTo: 2827, rate: 0.19, label: "Starter rate" },
  { upTo: 14921, rate: 0.2, label: "Basic rate" },
  { upTo: 31092, rate: 0.21, label: "Intermediate rate" },
  { upTo: 62430, rate: 0.42, label: "Higher rate" },
  { upTo: 112570, rate: 0.45, label: "Advanced rate" },
  { upTo: Infinity, rate: 0.48, label: "Top rate" },
];

const NI_PRIMARY_THRESHOLD = 12570;
const NI_UPPER_EARNINGS_LIMIT = 50270;
const NI_MAIN_RATE = 0.08;
const NI_UPPER_RATE = 0.02;

const STUDENT_LOAN_PLANS: Record<StudentLoanPlan, { threshold: number; rate: number; label: string }> = {
  plan1: { threshold: 26065, rate: 0.09, label: "Plan 1" },
  plan2: { threshold: 28470, rate: 0.09, label: "Plan 2" },
  plan4: { threshold: 32745, rate: 0.09, label: "Plan 4" },
  plan5: { threshold: 25000, rate: 0.09, label: "Plan 5" },
  postgrad: { threshold: 21000, rate: 0.06, label: "Postgrad" },
};

const BLIND_PERSONS_ALLOWANCE = 3130;

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

/** Parse a UK tax code like "1257L" or "K100" into an annual personal-allowance figure.
 *  Letters are largely ignored for the headline allowance, except "K" which represents
 *  a *negative* allowance (additions to taxable income). NT means no tax. BR/D0/D1 are
 *  flat-rate codes; we approximate by zeroing the allowance for these. */
export function parseTaxCode(code: string): { allowance: number; flatRate?: number } {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { allowance: PERSONAL_ALLOWANCE };
  if (c === "NT") return { allowance: Infinity };
  if (c === "BR") return { allowance: 0, flatRate: 0.2 };
  if (c === "D0") return { allowance: 0, flatRate: 0.4 };
  if (c === "D1") return { allowance: 0, flatRate: 0.45 };
  const kMatch = c.match(/^K(\d+)/);
  if (kMatch) return { allowance: -parseInt(kMatch[1], 10) * 10 };
  const nMatch = c.match(/^(\d+)/);
  if (nMatch) return { allowance: parseInt(nMatch[1], 10) * 10 };
  return { allowance: PERSONAL_ALLOWANCE };
}

function calcIncomeTax(
  taxable: number,
  region: Region,
  flatRate?: number,
): { total: number; bands: Breakdown["taxBands"] } {
  if (taxable <= 0) return { total: 0, bands: [] };
  if (flatRate !== undefined) {
    return {
      total: taxable * flatRate,
      bands: [{ label: `Flat ${(flatRate * 100).toFixed(0)}%`, rate: flatRate, amount: taxable, tax: taxable * flatRate }],
    };
  }

  const bands = region === "scotland" ? SCOTLAND_BANDS : ENGLAND_BANDS;
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

function calcNI(annualGross: number, age: number): number {
  /** Above State Pension age (66 for 2025/26) — no employee NI is due. */
  if (age >= 66) return 0;
  const pt = NI_PRIMARY_THRESHOLD;
  const uel = NI_UPPER_EARNINGS_LIMIT;
  if (annualGross <= pt) return 0;
  const mainBand = Math.min(annualGross, uel) - pt;
  const upperBand = Math.max(0, annualGross - uel);
  return mainBand * NI_MAIN_RATE + upperBand * NI_UPPER_RATE;
}

function calcStudentLoan(annualGross: number, plans: StudentLoanPlan[]): number {
  let total = 0;
  for (const p of plans) {
    const plan = STUDENT_LOAN_PLANS[p];
    if (annualGross > plan.threshold) {
      total += (annualGross - plan.threshold) * plan.rate;
    }
  }
  /** Loan repayments are rounded down to the nearest pound by HMRC. */
  return Math.floor(total);
}

export function calculate(input: CalculatorInput): Breakdown {
  const gross = annualiseGross(input);

  /** Pension via salary sacrifice / net-pay arrangement is deducted before tax & NI. */
  const pension =
    input.pensionMode === "percent"
      ? gross * Math.max(0, input.pensionContribution) / 100
      : Math.max(0, input.pensionContribution);
  const pensionable = Math.max(0, gross - pension);

  /** Personal allowance from tax code, plus tapering above £100k of *adjusted* income. */
  const codeInfo = parseTaxCode(input.taxCode);
  let pa = codeInfo.allowance;
  if (Number.isFinite(pa)) {
    if (pensionable > PA_TAPER_START) {
      const reduction = Math.min(pa, (pensionable - PA_TAPER_START) / 2);
      pa = Math.max(0, pa - reduction);
    }
    if (pensionable >= PA_TAPER_END && codeInfo.allowance === PERSONAL_ALLOWANCE) {
      pa = 0;
    }
    if (input.blindAllowance) pa += BLIND_PERSONS_ALLOWANCE;
  }

  const taxable = Number.isFinite(pa) ? Math.max(0, pensionable - pa) : 0;
  const tax = calcIncomeTax(taxable, input.region, codeInfo.flatRate);

  const ni = calcNI(gross, input.age);
  const studentLoan = calcStudentLoan(gross, input.studentLoans);

  const takeHome = gross - tax.total - ni - pension - studentLoan;

  return {
    gross,
    taxableIncome: taxable,
    personalAllowance: Number.isFinite(pa) ? pa : 0,
    incomeTax: tax.total,
    nationalInsurance: ni,
    pension,
    studentLoan,
    takeHome,
    taxBands: tax.bands,
    effectiveTaxRate: gross > 0 ? (tax.total + ni) / gross : 0,
    marginalRate: marginalRateFor(gross, taxable, input.region, codeInfo.flatRate),
  };
}

function marginalRateFor(gross: number, taxable: number, region: Region, flatRate?: number): number {
  const niRate = gross > NI_UPPER_EARNINGS_LIMIT ? NI_UPPER_RATE : gross > NI_PRIMARY_THRESHOLD ? NI_MAIN_RATE : 0;
  if (flatRate !== undefined) return flatRate + niRate;
  /** 60% trap: PA tapers between £100k and £125,140 of *adjusted* income — effectively doubling
   *  the higher-rate slice. We approximate that zone using gross. */
  if (gross > PA_TAPER_START && gross <= PA_TAPER_END) return 0.6 + niRate;
  const bands = region === "scotland" ? SCOTLAND_BANDS : ENGLAND_BANDS;
  let rate = bands[bands.length - 1].rate;
  for (const band of bands) {
    if (taxable <= band.upTo) {
      rate = band.rate;
      break;
    }
  }
  return rate + niRate;
}

/** Convert an annual figure into the equivalent for a different period. */
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
