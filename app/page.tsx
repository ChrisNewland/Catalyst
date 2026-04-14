import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null; // middleware redirects; belt-and-braces.

  const { logged } = await searchParams;

  const cats = await prisma.cat.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      logEntries: {
        where: { recordedAt: { gte: startOfToday() } },
        orderBy: { recordedAt: "desc" },
        take: 1,
        include: { volunteer: { select: { name: true } } },
      },
    },
  });

  const needsVisit = cats.filter((c) => c.logEntries.length === 0);
  const visitedToday = cats.filter((c) => c.logEntries.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {logged ? (
        <div
          data-testid="toast"
          role="status"
          aria-live="polite"
          className="rounded-lg bg-moss/10 text-moss border border-moss/30 p-3 text-sm"
        >
          Logged for {logged}.
        </div>
      ) : null}
      <h1 className="text-2xl font-bold">Cats in care</h1>

      {cats.length === 0 ? (
        <p className="text-ink/60">
          No cats registered yet.{" "}
          {(session.user as { role?: string }).role === "ADMIN" ? (
            <Link href="/admin/cats" className="underline">
              Add the first cat
            </Link>
          ) : (
            "Ask an admin to add some."
          )}
        </p>
      ) : null}

      {needsVisit.length > 0 && (
        <section>
          <h2 className="text-sm uppercase text-ink/60 mb-2">
            Needs visit today
          </h2>
          <ul className="flex flex-col gap-2">
            {needsVisit.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/cats/${cat.id}/log/new`}
                  className="card flex items-center justify-between hover:bg-white/80"
                  data-testid={`cat-row-${cat.id}`}
                >
                  <span className="font-semibold text-lg">{cat.name}</span>
                  <span className="btn-primary py-2 px-3 text-sm">Log visit</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visitedToday.length > 0 && (
        <section>
          <h2 className="text-sm uppercase text-ink/60 mb-2">Visited today</h2>
          <ul className="flex flex-col gap-2">
            {visitedToday.map((cat) => {
              const last = cat.logEntries[0];
              return (
                <li
                  key={cat.id}
                  className="card flex items-center justify-between"
                  data-testid={`cat-row-${cat.id}`}
                >
                  <Link href={`/cats/${cat.id}`} className="flex-1">
                    <div className="font-semibold text-lg">{cat.name}</div>
                    <div className="text-xs text-ink/60">
                      Last seen {formatTime(last.recordedAt)} by{" "}
                      {last.volunteer.name}
                    </div>
                  </Link>
                  <Link
                    href={`/cats/${cat.id}/log/new`}
                    className="btn-secondary py-2 px-3 text-sm ml-3"
                  >
                    Log again
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
