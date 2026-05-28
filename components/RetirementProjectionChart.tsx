"use client";

import type { YearlyPoint } from "@/lib/retirement";

interface Props {
  data: YearlyPoint[];
  fireNumber: number;
  targetAge: number;
  pensionAccessAge: number;
  statePensionAge: number;
}

const W = 720;
const H = 280;
const P = { top: 16, right: 12, bottom: 28, left: 64 };

function compactGBP(n: number): string {
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}m`;
  if (n >= 1_000) return `£${(n / 1_000).toFixed(0)}k`;
  return `£${Math.round(n)}`;
}

export default function RetirementProjectionChart({
  data,
  fireNumber,
  targetAge,
  pensionAccessAge,
  statePensionAge,
}: Props) {
  if (data.length === 0) return null;

  const xMin = data[0].age;
  const xMax = data[data.length - 1].age;
  const yMax = Math.max(fireNumber, ...data.map((d) => d.total)) * 1.08;

  const x = (age: number) =>
    P.left + ((age - xMin) / Math.max(1, xMax - xMin)) * (W - P.left - P.right);
  const y = (v: number) =>
    H - P.bottom - (Math.max(0, v) / Math.max(1, yMax)) * (H - P.top - P.bottom);

  /** Pension area: from baseline (y=0) up to pension value. */
  const pensionTop = data.map((d) => `${x(d.age)},${y(d.pension)}`).join(" ");
  const baseline = data.map((d) => `${x(d.age)},${y(0)}`).reverse().join(" ");
  const pensionArea = `M${pensionTop} L${baseline} Z`;

  /** ISA area: stacked on top of pension. */
  const isaTop = data.map((d) => `${x(d.age)},${y(d.pension + d.isa)}`).join(" ");
  const isaBottom = [...data].reverse().map((d) => `${x(d.age)},${y(d.pension)}`).join(" ");
  const isaArea = `M${isaTop} L${isaBottom} Z`;

  /** Y-axis ticks — 4 even steps. */
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMax * t);
  /** X-axis ticks every 10 years. */
  const xTicks: number[] = [];
  for (let a = Math.ceil(xMin / 10) * 10; a <= xMax; a += 10) xTicks.push(a);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Retirement projection">
      {/* Grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={P.left}
            x2={W - P.right}
            y1={y(v)}
            y2={y(v)}
            stroke="hsl(var(--border))"
            strokeDasharray={i === 0 ? "" : "3 4"}
            strokeWidth={i === 0 ? 1 : 0.75}
          />
          <text
            x={P.left - 8}
            y={y(v) + 4}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ fontSize: 10 }}
          >
            {compactGBP(v)}
          </text>
        </g>
      ))}
      {xTicks.map((a) => (
        <text
          key={a}
          x={x(a)}
          y={H - P.bottom + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 10 }}
        >
          {a}
        </text>
      ))}

      {/* Pension area */}
      <path d={pensionArea} fill="hsl(var(--money-pension) / 0.22)" stroke="hsl(var(--money-pension))" strokeWidth={1.25} />
      {/* ISA area on top */}
      <path d={isaArea} fill="hsl(var(--money-income) / 0.18)" stroke="hsl(var(--money-income))" strokeWidth={1.25} />

      {/* FIRE line */}
      {Number.isFinite(fireNumber) && (
        <g>
          <line
            x1={P.left}
            x2={W - P.right}
            y1={y(fireNumber)}
            y2={y(fireNumber)}
            stroke="hsl(var(--money-tax))"
            strokeDasharray="4 3"
            strokeWidth={1.25}
          />
          <text
            x={W - P.right}
            y={y(fireNumber) - 6}
            textAnchor="end"
            className="fill-[hsl(var(--money-tax))]"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            FIRE · {compactGBP(fireNumber)}
          </text>
        </g>
      )}

      {/* Target retirement age */}
      {targetAge >= xMin && targetAge <= xMax && (
        <g>
          <line
            x1={x(targetAge)}
            x2={x(targetAge)}
            y1={P.top}
            y2={H - P.bottom}
            stroke="hsl(var(--foreground))"
            strokeDasharray="2 3"
            strokeOpacity={0.55}
            strokeWidth={1}
          />
          <text
            x={x(targetAge) + 4}
            y={P.top + 10}
            className="fill-foreground"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            Retire {targetAge}
          </text>
        </g>
      )}

      {/* Pension access age marker */}
      {pensionAccessAge > targetAge && pensionAccessAge <= xMax && (
        <g>
          <line
            x1={x(pensionAccessAge)}
            x2={x(pensionAccessAge)}
            y1={P.top}
            y2={H - P.bottom}
            stroke="hsl(var(--money-loan))"
            strokeDasharray="2 3"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <text
            x={x(pensionAccessAge) + 4}
            y={P.top + 22}
            className="fill-[hsl(var(--money-loan))]"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            Pension {pensionAccessAge}
          </text>
        </g>
      )}

      {/* State pension marker */}
      {statePensionAge <= xMax && (
        <g>
          <line
            x1={x(statePensionAge)}
            x2={x(statePensionAge)}
            y1={P.top}
            y2={H - P.bottom}
            stroke="hsl(var(--money-childcare))"
            strokeDasharray="2 3"
            strokeOpacity={0.7}
            strokeWidth={1}
          />
          <text
            x={x(statePensionAge) + 4}
            y={P.top + 34}
            className="fill-[hsl(var(--money-childcare))]"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            State {statePensionAge}
          </text>
        </g>
      )}
    </svg>
  );
}
