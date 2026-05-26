import type {
  Breakdown,
  CalculatorInput,
  Frequency,
  IncomeTaxBand,
  Region,
  TaxYearConfig,
} from "./types";
import { TAX_YEARS } from "./years";
import { parseTaxCode } from "./codes";

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

function calcBandedTax(
  taxable: number,
  bands: IncomeTaxBand[],
  flat?: { rate: number; label: string },
): { total: number; bands: Breakdown["taxBands"] } {
  if (taxable <= 0) return { total: 0, bands: [] };
  if (flat) {
    return {
      total: taxable * flat.rate,
      bands: [{ label: flat.label, rate: flat.rate, amount: taxable, tax: taxable * flat.rate }],
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

function calcNI(annualNIable: number, age: number, year: TaxYearConfig): number {
  if (age >= year.statePensionAge) return 0;
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = year.ni;
  if (annualNIable <= primaryThreshold) return 0;
  const mainBand = Math.min(annualNIable, upperEarningsLimit) - primaryThreshold;
  const upperBand = Math.max(0, annualNIable - upperEarningsLimit);
  return mainBand * mainRate + upperBand * upperRate;
}

function calcStudentLoan(
  annualGross: number,
  plans: CalculatorInput["studentLoans"],
  year: TaxYearConfig,
): number {
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
    ? (baseFor * Math.max(0, input.pensionContribution)) / 100
    : Math.max(0, input.pensionContribution);
}

/** Compute reclaimable higher/additional-rate relief on a RAS pension.
 *  The provider applies basic-rate relief automatically; the rest can be
 *  reclaimed via Self-Assessment. We assume the contribution sits in the
 *  top slice of taxable income. */
function rasExtraRelief(
  pension: number,
  taxableAfterPa: number,
  bands: IncomeTaxBand[],
): number {
  if (pension <= 0 || taxableAfterPa <= 0) return 0;
  const basicRate = bands[0].rate;
  let extra = 0;
  let prevUpper = 0;
  for (const band of bands) {
    if (band.rate > basicRate) {
      const sliceTop = Math.min(taxableAfterPa, band.upTo);
      const sliceBottom = Math.max(prevUpper, taxableAfterPa - pension);
      const slice = Math.max(0, sliceTop - sliceBottom);
      extra += slice * (band.rate - basicRate);
    }
    prevUpper = band.upTo;
    if (taxableAfterPa <= band.upTo) break;
  }
  return extra;
}

export function calculate(input: CalculatorInput): Breakdown {
  const year = TAX_YEARS[input.taxYear];
  const codeInfo = parseTaxCode(input.taxCode, year);
  const secondJobCode = parseTaxCode(year.secondJob.defaultCode, year);

  const baseSalary = annualiseGross(input);
  const overtime = annualiseOvertime(input);
  const bonus = Math.max(0, input.bonusAnnual || 0);
  const secondJob = Math.max(0, input.secondJobAnnual || 0);
  const grossPrimary = baseSalary + overtime + bonus;
  const totalGross = grossPrimary + secondJob;

  const pension = pensionAmount(input, grossPrimary);
  const ccvCap = year.childcareVouchers.monthlyCap;
  const childcare = Math.max(0, Math.min(input.childcareVouchersMonthly || 0, ccvCap)) * 12;
  const bik = Math.max(0, input.taxableBenefits || 0);

  let taxableBase = grossPrimary;
  let niableBase = grossPrimary;

  if (input.pensionType === "salarySacrifice") {
    taxableBase -= pension;
    niableBase -= pension;
  } else if (input.pensionType === "auto") {
    /** Net-pay arrangement: reduces taxable income, NI calculated on full gross. */
    taxableBase -= pension;
  }
  /** Childcare vouchers (legacy scheme) — pre-tax and pre-NI. */
  taxableBase -= childcare;
  niableBase -= childcare;
  /** Benefits-in-kind add to taxable income (cash-equivalent), no employee NI. */
  taxableBase += bik;

  const allowances = year.allowances;
  let pa = codeInfo.allowance;
  if (Number.isFinite(pa) && pa > 0) {
    if (taxableBase > allowances.taperStart) {
      const reduction = Math.min(pa, (taxableBase - allowances.taperStart) / allowances.taperRatio);
      pa = Math.max(0, pa - reduction);
    }
    if (input.blindAllowance) pa += allowances.blindPersons;
    if (input.marriageAllowance) pa += allowances.marriage;
  } else if (input.blindAllowance) {
    pa = Math.max(pa, 0) + allowances.blindPersons;
  }

  const taxableAfterPa = Number.isFinite(pa) ? Math.max(0, taxableBase - pa) : 0;
  const regionBands = year.incomeTax[input.region];
  const flat =
    codeInfo.flatRate !== undefined && codeInfo.flatLabel
      ? { rate: codeInfo.flatRate, label: codeInfo.flatLabel }
      : undefined;
  const mainTax = calcBandedTax(taxableAfterPa, regionBands, flat);

  /** Second job: flat-coded (BR by default), own NI thresholds. */
  const secondFlat =
    secondJobCode.flatRate !== undefined && secondJobCode.flatLabel
      ? { rate: secondJobCode.flatRate, label: secondJobCode.flatLabel }
      : undefined;
  const secondTax = secondFlat ? secondJob * secondFlat.rate : 0;
  const niMain = calcNI(niableBase, input.age, year);
  const niSecond = calcNI(secondJob, input.age, year);

  /** Student loan repayments are assessed on "earnings" — which for HMRC purposes
   *  is gross *after* salary sacrifice (the sacrificed amount stops being earnings)
   *  but *before* net-pay (AE) or RAS pension contributions. Childcare vouchers
   *  via salary sacrifice are similarly removed. */
  const slPrimaryBase =
    input.pensionType === "salarySacrifice" ? grossPrimary - pension - childcare : grossPrimary - childcare;
  const studentLoan = calcStudentLoan(slPrimaryBase + secondJob, input.studentLoans, year);

  let employeePension = 0;
  let pensionExtraRelief = 0;
  if (input.pensionType === "salarySacrifice" || input.pensionType === "auto") {
    employeePension = pension;
  } else if (input.pensionType === "personalRas") {
    employeePension = pension * year.pensionRelief.rasEmployeeFraction;
    pensionExtraRelief = rasExtraRelief(pension, taxableAfterPa, regionBands);
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
    marginalRate: marginalRateFor(taxableBase, taxableAfterPa, year, input.region, codeInfo.flatRate),
  };
}

function marginalRateFor(
  taxableBase: number,
  taxableAfterPa: number,
  year: TaxYearConfig,
  region: Region,
  flatRate?: number,
): number {
  const { primaryThreshold, upperEarningsLimit, mainRate, upperRate } = year.ni;
  const niRate =
    taxableBase > upperEarningsLimit
      ? upperRate
      : taxableBase > primaryThreshold
        ? mainRate
        : 0;
  if (flatRate !== undefined) return flatRate + niRate;
  const bands = year.incomeTax[region];
  let bandRate = bands[bands.length - 1].rate;
  for (const band of bands) {
    if (taxableAfterPa <= band.upTo) {
      bandRate = band.rate;
      break;
    }
  }
  const { taperStart, taperEnd, taperRatio } = year.allowances;
  /** PA-taper zone: every £1 of income loses £(1/taperRatio) of allowance,
   *  which then becomes taxable at the marginal band rate. */
  if (taxableBase > taperStart && taxableBase <= taperEnd) {
    return bandRate * (1 + 1 / taperRatio) + niRate;
  }
  return bandRate + niRate;
}

export function inFrequency(
  annual: number,
  frequency: Frequency,
  input: { hoursPerWeek: number; daysPerWeek: number },
): number {
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
