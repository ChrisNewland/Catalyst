import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

function formatDateTime(d: Date) {
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleCase(v: string) {
  return v[0] + v.slice(1).toLowerCase();
}

export default async function CatProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cat = await prisma.cat.findUnique({ where: { id } });
  if (!cat) notFound();

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const entries = await prisma.logEntry.findMany({
    where: { catId: id, recordedAt: { gte: since } },
    orderBy: { recordedAt: "desc" },
    include: { volunteer: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{cat.name}</h1>
        <Link href={`/cats/${cat.id}/log/new`} className="btn-primary py-2 px-3 text-sm">
          Log visit
        </Link>
      </div>

      {cat.notes ? (
        <p className="text-sm text-ink/70 card">{cat.notes}</p>
      ) : null}

      <h2 className="text-sm uppercase text-ink/60 mt-2">Last 7 days</h2>

      {entries.length === 0 ? (
        <p data-testid="no-entries" className="text-ink/60 card">
          No log entries yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id} data-testid="log-entry" className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {formatDateTime(e.recordedAt)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    e.condition === "GOOD"
                      ? "bg-moss/10 text-moss"
                      : e.condition === "CONCERN"
                        ? "bg-yellow-500/10 text-yellow-700"
                        : "bg-alarm/10 text-alarm"
                  }`}
                >
                  {titleCase(e.condition)}
                </span>
              </div>
              <div className="text-sm text-ink/70">
                by {e.volunteer.name}
              </div>
              <div className="text-sm">
                Food: {titleCase(e.foodOffered)} · Water:{" "}
                {titleCase(e.waterIntake)} · Urinated:{" "}
                {e.urinated ? "yes" : "no"} · Defecated:{" "}
                {e.defecated ? "yes" : "no"}
                {e.defecated && e.bristolScore != null
                  ? ` (Bristol ${e.bristolScore})`
                  : ""}
                {e.weightGrams != null ? ` · ${e.weightGrams} g` : ""}
              </div>
              {e.behaviourNotes ? (
                <div className="text-sm italic text-ink/70">
                  Behaviour: {e.behaviourNotes}
                </div>
              ) : null}
              {e.generalNotes ? (
                <div className="text-sm italic text-ink/70">
                  Notes: {e.generalNotes}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
