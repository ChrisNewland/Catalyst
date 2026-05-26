"use client";

interface Segment {
  label: string;
  value: number;
  color: string;
}

export default function BreakdownBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-subtle ring-1 ring-inset ring-[color:var(--border)]">
        {visible.map((s, i) => (
          <div
            key={i}
            className={`${s.color} transition-[flex-basis] duration-300`}
            style={{ flexBasis: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${((s.value / total) * 100).toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {visible.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
            <span className="font-medium text-ink-soft">{s.label}</span>
            <span className="text-ink-muted tabular-nums">
              {((s.value / total) * 100).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
