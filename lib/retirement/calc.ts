/** Retirement / FIRE projection engine.
 *  All amounts are in *today's pounds* — i.e. we work with real (inflation-adjusted)
 *  returns so users don't have to mentally discount future-pound figures. */

export interface RetirementInput {
  currentAge: number;
  targetRetirementAge: number;
  /** Annual spending in retirement, in today's £. */
  annualSpend: number;

  /** Current value of pension pots (SIPP, workplace, etc.). */
  currentPensionPot: number;
  /** Total annual pension contribution (employee + employer + tax relief). */
  annualPensionContribution: number;

  /** Current value of bridge funds (ISA / GIA) — used before pension access age. */
  currentIsaPot: number;
  annualIsaContribution: number;

  /** Real (inflation-adjusted) annual return assumption, as a decimal (e.g. 0.05). */
  realReturnRate: number;
  /** Safe withdrawal rate as a decimal (e.g. 0.035 = "3.5% rule"). */
  swr: number;

  /** Earliest age at which the pension pot can be drawn (UK: 55 → 57 from 2028). */
  pensionAccessAge: number;

  includeStatePension: boolean;
  statePensionAge: number;
  /** Annual state pension entitlement in today's £ (2025/26 full new pension: £11,973). */
  statePensionAnnual: number;
}

export interface YearlyPoint {
  age: number;
  pension: number;
  isa: number;
  total: number;
  /** Whether this year is in the "draw-down" phase. */
  drawing: boolean;
}

export interface RetirementProjection {
  /** Pot size needed to fund full annual spend at the chosen SWR (no state pension offset). */
  fireNumber: number;
  /** With state pension offsetting spend after stateAgePension. */
  fireNumberWithStatePension: number;

  /** Pot needed *today* that grows to fireNumber by target age with zero further contributions. */
  coastFireToday: number;
  /** Age at which contributions can stop and the pot still grows to fireNumber by target age.
   *  null if not achievable by target age at the current contribution rate. */
  coastFireAge: number | null;
  /** True if the user is already at or beyond their Coast FIRE position. */
  canCoastNow: boolean;

  /** Projected pots at chosen target age. */
  projectedPensionAtTarget: number;
  projectedIsaAtTarget: number;
  projectedTotalAtTarget: number;

  /** Age at which projected total first crosses the FIRE number. null if never. */
  fireAge: number | null;
  yearsToFire: number | null;

  /** Years between target retirement and pension access age — must be ISA-funded. */
  bridgeGapYears: number;
  /** Total ISA / GIA money needed to bridge those years (real £, not discounted). */
  bridgeFundsNeeded: number;
  /** Shortfall between projected ISA pot at target and bridge requirement. 0 if covered. */
  bridgeShortfall: number;

  /** Year-by-year simulation, from currentAge to age 90. */
  yearly: YearlyPoint[];
}

/** Future value of an initial pot growing at rate r for n years, with annual contributions
 *  added at the end of each year (ordinary annuity). All in real terms. */
export function projectPot(initial: number, annualContribution: number, years: number, rate: number): number {
  if (years <= 0) return Math.max(0, initial);
  const growth = initial * Math.pow(1 + rate, years);
  /** Edge case: r=0 means contributions accumulate linearly. */
  const annuity =
    rate === 0
      ? annualContribution * years
      : annualContribution * ((Math.pow(1 + rate, years) - 1) / rate);
  return Math.max(0, growth + annuity);
}

export function projectRetirement(input: RetirementInput): RetirementProjection {
  const {
    currentAge,
    targetRetirementAge,
    annualSpend,
    currentPensionPot,
    annualPensionContribution,
    currentIsaPot,
    annualIsaContribution,
    realReturnRate: r,
    swr,
    pensionAccessAge,
    includeStatePension,
    statePensionAge,
    statePensionAnnual,
  } = input;

  const yearsToTarget = Math.max(0, targetRetirementAge - currentAge);
  const fireNumber = swr > 0 ? annualSpend / swr : Infinity;
  const offsetSpend = includeStatePension ? Math.max(0, annualSpend - statePensionAnnual) : annualSpend;
  const fireNumberWithStatePension = swr > 0 ? offsetSpend / swr : Infinity;

  const coastFireToday = yearsToTarget > 0 ? fireNumber / Math.pow(1 + r, yearsToTarget) : fireNumber;

  /** Find earliest age at which stopping contributions still grows the pot to FIRE by target. */
  let coastFireAge: number | null = null;
  for (let stopAge = currentAge; stopAge <= targetRetirementAge; stopAge++) {
    const yrsContrib = stopAge - currentAge;
    const yrsCoast = targetRetirementAge - stopAge;
    const pensionAtStop = projectPot(currentPensionPot, annualPensionContribution, yrsContrib, r);
    const isaAtStop = projectPot(currentIsaPot, annualIsaContribution, yrsContrib, r);
    const totalAtTarget = (pensionAtStop + isaAtStop) * Math.pow(1 + r, yrsCoast);
    if (totalAtTarget >= fireNumber) {
      coastFireAge = stopAge;
      break;
    }
  }
  const canCoastNow = coastFireAge === currentAge;

  const projectedPensionAtTarget = projectPot(currentPensionPot, annualPensionContribution, yearsToTarget, r);
  const projectedIsaAtTarget = projectPot(currentIsaPot, annualIsaContribution, yearsToTarget, r);
  const projectedTotalAtTarget = projectedPensionAtTarget + projectedIsaAtTarget;

  /** Year-by-year simulation including drawdown phase. */
  const yearly: YearlyPoint[] = [];
  let pension = currentPensionPot;
  let isa = currentIsaPot;
  let fireAge: number | null = null;

  for (let age = currentAge; age <= 90; age++) {
    const drawing = age >= targetRetirementAge;
    yearly.push({
      age,
      pension: Math.max(0, pension),
      isa: Math.max(0, isa),
      total: Math.max(0, pension + isa),
      drawing,
    });
    if (fireAge === null && pension + isa >= fireNumber) fireAge = age;

    pension *= 1 + r;
    isa *= 1 + r;

    if (!drawing) {
      pension += annualPensionContribution;
      isa += annualIsaContribution;
    } else {
      const spend =
        age >= statePensionAge && includeStatePension
          ? Math.max(0, annualSpend - statePensionAnnual)
          : annualSpend;
      if (age < pensionAccessAge) {
        /** Pension is locked — bridge spend from ISA only. */
        isa -= spend;
      } else if (isa > 0) {
        /** Draw ISA first while available, then dip into pension. */
        const fromIsa = Math.min(isa, spend);
        isa -= fromIsa;
        const remaining = spend - fromIsa;
        if (remaining > 0) pension -= remaining;
      } else {
        pension -= spend;
      }
    }
  }

  const bridgeGapYears = Math.max(0, pensionAccessAge - targetRetirementAge);
  const bridgeFundsNeeded = bridgeGapYears * annualSpend;
  const bridgeShortfall = Math.max(0, bridgeFundsNeeded - projectedIsaAtTarget);

  return {
    fireNumber,
    fireNumberWithStatePension,
    coastFireToday,
    coastFireAge,
    canCoastNow,
    projectedPensionAtTarget,
    projectedIsaAtTarget,
    projectedTotalAtTarget,
    fireAge,
    yearsToFire: fireAge !== null ? fireAge - currentAge : null,
    bridgeGapYears,
    bridgeFundsNeeded,
    bridgeShortfall,
    yearly,
  };
}

/** Default starting values for a typical UK earner. */
export const DEFAULT_RETIREMENT_INPUT: RetirementInput = {
  currentAge: 30,
  targetRetirementAge: 60,
  annualSpend: 30000,
  currentPensionPot: 25000,
  annualPensionContribution: 5000,
  currentIsaPot: 10000,
  annualIsaContribution: 4000,
  realReturnRate: 0.05,
  swr: 0.035,
  pensionAccessAge: 57,
  includeStatePension: true,
  statePensionAge: 67,
  statePensionAnnual: 11973,
};

/** Derive a sensible default annual pension contribution from the salary calculator's
 *  pension setup. Used to pre-populate the retirement form when the user switches tabs. */
export function pensionContributionFromSalary(args: {
  annualGross: number;
  pensionMode: "percent" | "amount";
  pensionContribution: number;
  pensionType: "auto" | "salarySacrifice" | "personalRas" | "employer";
}): number {
  if (args.pensionType === "employer") return 0;
  return args.pensionMode === "percent"
    ? (args.annualGross * Math.max(0, args.pensionContribution)) / 100
    : Math.max(0, args.pensionContribution);
}
