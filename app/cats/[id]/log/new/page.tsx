import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
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
          Log visit <span className="text-ink/50 font-normal">— {cat.name}</span>
        </h1>
        <Link href="/" className="text-sm underline">
          Cancel
        </Link>
      </div>
      <LogForm catId={cat.id} catName={cat.name} />
    </div>
  );
}
