import type { TaxYearConfig } from "./types";

export interface ParsedTaxCode {
  /** Effective annual personal allowance implied by the code. */
  allowance: number;
  /** When the code mandates a flat rate (BR/D0/D1), the rate and band label. */
  flatRate?: number;
  flatLabel?: string;
}

/** PAYE flat-rate codes map to positions in the year's RoUK band table.
 *  Defining the mapping here keeps BR/D0/D1 in step with band changes — if
 *  the basic rate ever moved from 20%, BR would move with it automatically. */
const FLAT_RATE_CODE_BAND_INDEX: Record<string, number> = {
  BR: 0,
  D0: 1,
  D1: 2,
};

/** Parse a UK PAYE tax code.
 *  - Number prefix (e.g. 1257L): personal allowance is N × 10.
 *  - K-prefix (e.g. K100): *negative* allowance, added to taxable income.
 *  - BR / D0 / D1: flat-rate codes — rates sourced from the year's RoUK bands.
 *  - NT: no tax.
 *  - Blank / unrecognised: use the year's standard personal allowance.
 */
export function parseTaxCode(code: string, year: TaxYearConfig): ParsedTaxCode {
  const c = (code || "").trim().toUpperCase();
  if (!c) return { allowance: year.allowances.personalAllowance };
  if (c === "NT") return { allowance: Infinity };

  const flatIdx = FLAT_RATE_CODE_BAND_INDEX[c];
  if (flatIdx !== undefined) {
    const band = year.incomeTax.england[flatIdx];
    return { allowance: 0, flatRate: band.rate, flatLabel: band.label };
  }

  const kMatch = c.match(/^K(\d+)/);
  if (kMatch) return { allowance: -parseInt(kMatch[1], 10) * 10 };
  const nMatch = c.match(/^(\d+)/);
  if (nMatch) return { allowance: parseInt(nMatch[1], 10) * 10 };
  return { allowance: year.allowances.personalAllowance };
}
