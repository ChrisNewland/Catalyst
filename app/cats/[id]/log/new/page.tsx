import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import LogForm from "./LogForm";

export default async function NewLogEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cat = await prisma.cat.findUnique({ where: { id } });
  if (!cat || cat.archivedAt) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Log visit{" "}
          <span className="text-muted-foreground font-normal">{"\u2014"} {cat.name}</span>
        </h1>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Cancel</Link>
        </Button>
      </div>
      <LogForm catId={cat.id} catName={cat.name} />
    </div>
  );
}
