/** Public type system for the tax calculator. Year-specific data lives in
 *  ./years.ts; calculation logic in ./calc.ts. Adding a new tax year is a
 *  matter of adding a key to TAX_YEARS — no calculation code should need to
 *  change for routine threshold updates. */

export type Region = "england" | "scotland";
export type Frequency = "yearly" | "monthly" | "weekly" | "daily" | "hourly";
export type PensionMode = "percent" | "amount";
/**
 * - auto: net-pay / auto-enrolment — reduces taxable income but not NI base.
 * - salarySacrifice: reduces both taxable and NI base.
 * - personalRas: paid from net pay; provider claims basic-rate relief.
 * - employer: paid by employer on top of salary; no effect on take-home.
 */
export type PensionType = "auto" | "salarySacrifice" | "personalRas" | "employer";
export type StudentLoanPlan = "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";
export type TaxYear = "2025-26" | "2024-25";

/** A single income-tax band expressed as a cumulative width *above* the personal
 *  allowance — matches HMRC's published "basic rate band: £37,700" framing. */
export interface IncomeTaxBand {
  upTo: number;
  rate: number;
  label: string;
}

export interface NIConfig {
  /** Annual primary threshold (no employee NI below this). */
  primaryThreshold: number;
  /** Annual upper earnings limit — rate steps down above this. */
  upperEarningsLimit: number;
  /** Class 1 employee rate between PT and UEL. */
  mainRate: number;
  /** Class 1 employee rate above UEL. */
  upperRate: number;
}

export interface StudentLoanConfig {
  threshold: number;
  rate: number;
  label: string;
}

export interface AllowancesConfig {
  /** Standard personal allowance (normally implied by the 1257L tax code). */
  personalAllowance: number;
  /** Income above which the personal allowance starts to taper. */
  taperStart: number;
  /** Income at which the personal allowance is fully removed. */
  taperEnd: number;
  /** £1 of allowance lost for every £N of income above taperStart (UK norm: 2). */
  taperRatio: number;
  blindPersons: number;
  marriage: number;
}

export interface ChildcareVoucherConfig {
  /** Monthly cap on pre-tax vouchers (legacy scheme, closed to new joiners since 2018). */
  monthlyCap: number;
}

export interface PensionReliefConfig {
  /** Fraction the employee actually pays for a RAS contribution
   *  (provider grosses up to 1.0 via basic-rate relief). For UK basic rate of
   *  20% this is 0.8 — and tracks the basic-rate band in years where it differs. */
  rasEmployeeFraction: number;
}

export interface SecondJobConfig {
  /** PAYE code applied to additional employments by default. */
  defaultCode: string;
}

export interface TaxYearConfig {
  label: string;
  allowances: AllowancesConfig;
  /** Income-tax bands keyed by tax region. */
  incomeTax: Record<Region, IncomeTaxBand[]>;
  ni: NIConfig;
  /** Age at which employee NI stops being due. */
  statePensionAge: number;
  studentLoans: Record<StudentLoanPlan, StudentLoanConfig>;
  childcareVouchers: ChildcareVoucherConfig;
  pensionRelief: PensionReliefConfig;
  secondJob: SecondJobConfig;
}

export interface CalculatorInput {
  taxYear: TaxYear;
  grossInput: number;
  frequency: Frequency;
  hoursPerWeek: number;
  daysPerWeek: number;
  bonusAnnual: number;
  overtimeHoursPerWeek: number;
  overtimeMultiplier: number;
  secondJobAnnual: number;
  taxCode: string;
  region: Region;
  age: number;
  pensionMode: PensionMode;
  pensionType: PensionType;
  pensionContribution: number;
  childcareVouchersMonthly: number;
  taxableBenefits: number;
  studentLoans: StudentLoanPlan[];
  blindAllowance: boolean;
  marriageAllowance: boolean;
}

export interface Breakdown {
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
  pension: number;
  pensionExtraRelief: number;
  studentLoan: number;
  childcareVouchers: number;
  taxableBenefits: number;
  takeHome: number;
  taxBands: { label: string; rate: number; amount: number; tax: number }[];
  effectiveTaxRate: number;
  marginalRate: number;
}
