import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function conditionVariant(c: string): "good" | "concern" | "urgent" {
  if (c === "CONCERN") return "concern";
  if (c === "URGENT") return "urgent";
  return "good";
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
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{cat.name}</h1>
        <Button size="sm" asChild>
          <Link href={`/cats/${cat.id}/log/new`}>Log visit</Link>
        </Button>
      </div>

      {cat.notes ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            {cat.notes}
          </CardContent>
        </Card>
      ) : null}

      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mt-2">
        Last 7 days
      </h2>

      {entries.length === 0 ? (
        <Card>
          <CardContent
            data-testid="no-entries"
            className="text-muted-foreground text-center py-8"
          >
            No log entries yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id}>
              <Card data-testid="log-entry">
                <CardContent className="flex flex-col gap-1.5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {formatDateTime(e.recordedAt)}
                    </span>
                    <Badge variant={conditionVariant(e.condition)}>
                      {titleCase(e.condition)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    by {e.loggedByName}
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
                    <div className="text-sm italic text-muted-foreground">
                      Behaviour: {e.behaviourNotes}
                    </div>
                  ) : null}
                  {e.generalNotes ? (
                    <div className="text-sm italic text-muted-foreground">
                      Notes: {e.generalNotes}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
