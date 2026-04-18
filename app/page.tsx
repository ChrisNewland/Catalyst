import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, PawPrint } from "lucide-react";

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
  if (!session?.user) return null;

  const { logged } = await searchParams;

  const cats = await prisma.cat.findMany({
    where: { archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      logEntries: {
        where: { recordedAt: { gte: startOfToday() } },
        orderBy: { recordedAt: "desc" },
        take: 1,
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
          className="rounded-xl bg-teal/20 text-teal-dark border border-teal/40 p-3 text-sm font-medium flex items-center gap-2"
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          Logged for {logged}.
        </div>
      ) : null}
      <h1 className="text-2xl font-bold">Cats in care</h1>

      {cats.length === 0 ? (
        <Card>
          <CardContent className="text-center text-muted-foreground py-8">
            No cats registered yet.{" "}
            {(session.user as { role?: string }).role === "ADMIN" ? (
              <Link href="/admin/cats" className="underline text-primary font-medium">
                Add the first cat
              </Link>
            ) : (
              "Ask an admin to add some."
            )}
          </CardContent>
        </Card>
      ) : null}

      {needsVisit.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Needs visit today
          </h2>
          <ul className="flex flex-col gap-2">
            {needsVisit.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/cats/${cat.id}/log/new`}
                  data-testid={`cat-row-${cat.id}`}
                >
                  <Card className="hover:shadow-md transition-shadow hover:border-primary/30">
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-pink rounded-full p-2">
                          <PawPrint className="h-5 w-5 text-mauve-dark" />
                        </span>
                        <span className="font-semibold text-lg">{cat.name}</span>
                      </div>
                      <Button size="sm">Log visit</Button>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visitedToday.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Visited today
          </h2>
          <ul className="flex flex-col gap-2">
            {visitedToday.map((cat) => {
              const last = cat.logEntries[0];
              return (
                <li key={cat.id}>
                  <Card
                    className="border-teal/30"
                    data-testid={`cat-row-${cat.id}`}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <Link href={`/cats/${cat.id}`} className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="bg-teal-light rounded-full p-2">
                            <PawPrint className="h-5 w-5 text-teal-dark" />
                          </span>
                          <div>
                            <div className="font-semibold text-lg">{cat.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Last seen {formatTime(last.recordedAt)} by{" "}
                              {last.loggedByName}
                            </div>
                          </div>
                        </div>
                      </Link>
                      <Link href={`/cats/${cat.id}/log/new`}>
                        <Button variant="outline" size="sm" className="ml-3">
                          Log again
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
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
