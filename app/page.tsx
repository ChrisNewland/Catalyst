import SalaryCalculator from "@/components/SalaryCalculator";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <span className="chip text-brand-700 dark:text-brand-300">Tax year 2025 / 2026</span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What&apos;s your take-home pay?
        </h1>
        <p className="max-w-2xl text-ink-muted">
          Enter your gross salary and we&apos;ll work out what lands in your bank account after Income Tax,
          National Insurance, pension and student loan repayments. Updates instantly as you type.
        </p>
      </section>
      <SalaryCalculator />
    </div>
  );
}
