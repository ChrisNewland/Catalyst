#!/usr/bin/env node
/**
 * Drive the local dev server AND thesalarycalculator.co.uk side-by-side
 * with the same inputs, then tabulate parity.
 *
 *   npm run dev               # in one terminal
 *   node scripts/compare-live.mjs
 *
 * Requires puppeteer (one-off): npm i -D puppeteer
 *
 * Cannot run in restricted-network sandboxes (the external host is blocked).
 * Run on your own machine.
 */
import puppeteer from "puppeteer";

const LOCAL = process.env.LOCAL_URL || "http://localhost:3000";
const TSC = "https://www.thesalarycalculator.co.uk/salary.php";

const scenarios = [
  { name: "£20,000 basic", gross: 20000, taxCode: "1257L", pensionPct: 0, plan2: false, scotland: false },
  { name: "£30,000 basic", gross: 30000, taxCode: "1257L", pensionPct: 0, plan2: false, scotland: false },
  { name: "£60,000 higher", gross: 60000, taxCode: "1257L", pensionPct: 0, plan2: false, scotland: false },
  { name: "£100,000 just-below-taper", gross: 100000, taxCode: "1257L", pensionPct: 0, plan2: false, scotland: false },
  { name: "£30,000 Scotland", gross: 30000, taxCode: "1257L", pensionPct: 0, plan2: false, scotland: true },
  { name: "£30,000 + Plan 2", gross: 30000, taxCode: "1257L", pensionPct: 0, plan2: true, scotland: false },
];

/** Drive our tool and pull the monthly take-home (the headline figure). */
async function ourTakeHome(page, s) {
  await page.goto(LOCAL, { waitUntil: "networkidle0" });
  await page.waitForSelector('[role="tab"]', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 400));

  const setField = async (sel, val) => {
    await page.focus(sel);
    await page.keyboard.down("Control");
    await page.keyboard.press("A");
    await page.keyboard.up("Control");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(String(val));
    await page.keyboard.press("Tab");
  };

  /** Switch to yearly view so we can directly read annual numbers. */
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('[role="tab"]')].find((el) => el.textContent?.trim() === "Yearly");
    t?.click();
  });
  await setField("#gross", s.gross);
  await setField("#taxCode", s.taxCode);
  if (s.scotland) {
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('[role="tab"]')].find((el) => el.textContent?.includes("Scotland"));
      t?.click();
    });
  }
  if (s.plan2) {
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button[aria-expanded]')];
      const sl = btns.find((b) => b.textContent?.includes("Student loan"));
      if (sl && sl.getAttribute("aria-expanded") === "false") sl.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => document.querySelector("#sl-plan2")?.click());
  }
  await new Promise((r) => setTimeout(r, 400));

  /** Pull the take-home number from the result panel headline. */
  const txt = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find((el) =>
      el.textContent?.trim().match(/^£[\d,]+(\.\d+)?$/),
    );
    return p?.textContent?.trim();
  });
  return parseGBP(txt);
}

/** Drive thesalarycalculator.co.uk and pull the yearly take-home. */
async function tscTakeHome(page, s) {
  await page.goto(TSC, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(
    ({ gross, taxCode, scotland, plan2 }) => {
      /** Field names below match the public form. They occasionally change —
       *  if a scenario fails on TSC's side, re-inspect the form. */
      const setByName = (name, val) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) {
          el.value = String(val);
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      };
      setByName("AnnualGrossSalary", gross);
      setByName("Salary", gross);
      setByName("TaxCode", taxCode);
      /** Toggle Scottish tax via a select / radio if present. */
      if (scotland) {
        const scot = document.querySelector('input[name="ScottishTax"], select[name="ScottishTax"]');
        if (scot) {
          if (scot.tagName === "SELECT") scot.value = "1";
          else scot.checked = true;
          scot.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      /** Plan 2 student loan toggle. */
      if (plan2) {
        const sl = document.querySelector('select[name="StudentLoan"], select[name="Plan"]');
        if (sl) {
          for (const opt of sl.options) if (/plan ?2/i.test(opt.textContent ?? "")) sl.value = opt.value;
          sl.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    },
    s,
  );

  /** Submit the form. */
  await page.evaluate(() => {
    const submit = document.querySelector('input[type="submit"], button[type="submit"]');
    submit?.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  /** Pull the yearly take-home from the result table. */
  const txt = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("tr")];
    for (const row of rows) {
      const text = row.textContent?.toLowerCase() ?? "";
      if (text.includes("take") && text.includes("home") && /year|annual/.test(text)) {
        const cells = [...row.querySelectorAll("td")];
        for (const c of cells) {
          if (/^£[\d,]+/.test(c.textContent?.trim() ?? "")) return c.textContent?.trim();
        }
      }
    }
    /** Fallback: any cell containing £-formatted number near "take-home". */
    const labels = [...document.querySelectorAll("*")].filter((el) => /take.?home/i.test(el.textContent ?? ""));
    return labels[0]?.parentElement?.querySelector('td, span')?.textContent?.trim();
  });
  return parseGBP(txt);
}

function parseGBP(s) {
  if (!s) return null;
  return parseFloat(s.replace(/[£,\s]/g, "")) || null;
}

(async () => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ignoreHTTPSErrors: true,
  });
  const pageA = await browser.newPage();
  const pageB = await browser.newPage();
  await pageB.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  );

  console.log("\nScenario                                | Catalyst   | TheSalaryCalc | Δ");
  console.log("-".repeat(80));
  for (const s of scenarios) {
    let ours = null;
    let tsc = null;
    try {
      ours = await ourTakeHome(pageA, s);
    } catch (e) {
      console.error(`  Catalyst error for ${s.name}:`, e.message);
    }
    try {
      tsc = await tscTakeHome(pageB, s);
    } catch (e) {
      console.error(`  TSC error for ${s.name}:`, e.message);
    }
    const delta = ours !== null && tsc !== null ? ours - tsc : null;
    const ok = delta !== null && Math.abs(delta) <= 2;
    const fmt = (n) => (n === null ? "  —  " : `£${n.toLocaleString("en-GB")}`);
    console.log(
      `${ok ? "✓" : "✗"} ${s.name.padEnd(40)} | ${fmt(ours).padStart(10)} | ${fmt(tsc).padStart(13)} | ${delta === null ? "—" : `£${delta.toFixed(0)}`}`,
    );
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
