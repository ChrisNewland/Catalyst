# UK Salary Calculator

A modern, fast, mobile-friendly calculator for UK take-home pay — a fresh UX
take on tools like thesalarycalculator.co.uk.

Enter a gross salary and instantly see your net pay broken down by Income Tax,
National Insurance, pension contributions and student loan repayments. Supports
both Rest-of-UK and Scottish tax bands for the **2025/26** tax year.

## Stack

- **Next.js 15** App Router + **React 18** + **TypeScript**
- **Tailwind CSS** with a custom design system (light / dark themes)
- **Vitest** for unit-testing the tax engine
- Zero backend — the calculator runs entirely in the browser

## Features

- Yearly / Monthly / Weekly / Daily / Hourly input and result views
- Pension contributions (percentage or annual £ amount, pre-tax)
- Student loan repayments — Plans 1, 2, 4, 5 and Postgraduate
- Tax code parsing (1257L, BR, D0, D1, K codes, NT)
- Personal allowance tapering above £100,000 (the 60% trap)
- Blind Person's Allowance
- State Pension age handling (no employee NI from 66)
- Live effective and marginal tax-rate readouts
- Income Tax band-by-band breakdown
- Light / dark mode with system preference detection

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run test         # tax-engine unit tests
npm run build        # production build
```

## Project layout

```
app/
  layout.tsx          root shell + theme bootstrap
  page.tsx            hero + calculator
  globals.css         design tokens + Tailwind layer extensions
components/
  SalaryCalculator.tsx   form (inputs, segmented controls, validation)
  ResultPanel.tsx        take-home headline, stats, tax-band breakdown
  BreakdownBar.tsx       stacked deduction visualisation
  ThemeToggle.tsx        light/dark switcher
lib/
  tax.ts              pure calculation engine (2025/26 thresholds)
tests/
  tax.test.ts         engine unit tests
```

## Notes

Figures are estimates. They use HMRC's published 2025/26 thresholds and rates
but do not model every edge case (e.g. marriage allowance transfers, share
schemes, taxable benefits, salary-sacrifice NI savings beyond the basic
pre-tax deduction). Not financial advice.
