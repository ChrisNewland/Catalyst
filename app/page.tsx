import SalaryCalculator from "@/components/SalaryCalculator";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="accent" className="rounded-full">
          Tax year 2025 / 2026
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          What&apos;s your take-home pay?
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Enter your gross salary and we&apos;ll work out what lands in your bank account after Income Tax, National
          Insurance, pension and student loan repayments. Updates instantly as you type.
        </p>
      </section>
      <SalaryCalculator />
    </div>
  );
}
