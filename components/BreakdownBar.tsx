"use client";

interface Segment {
  label: string;
  value: number;
  /** CSS variable name (without the `--` prefix). */
  var: string;
}

interface Props {
  segments: Segment[];
  /** Compact mode hides the legend (for stacked side-by-side comparisons). */
  compact?: boolean;
}

export default function BreakdownBar({ segments, compact = false }: Props) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border">
        {visible.map((s, i) => (
          <div
            key={i}
            className="transition-[flex-basis] duration-300"
            style={{
              flexBasis: `${(s.value / total) * 100}%`,
              background: `hsl(var(--${s.var}))`,
            }}
            title={`${s.label}: ${((s.value / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {visible.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: `hsl(var(--${s.var}))` }} />
              <span className="font-medium text-foreground">{s.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {((s.value / total) * 100).toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
