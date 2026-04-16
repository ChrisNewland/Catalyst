import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Test-only database reset. Disabled in production.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not available", { status: 404 });
  }

  await prisma.logEntry.deleteMany();
  await prisma.cat.deleteMany();

  await prisma.cat.createMany({
    data: [
      { name: "Mittens", notes: "Friendly tabby, loves chin scratches." },
      { name: "Shadow", notes: "Shy black cat, hides under the cat tree." },
      { name: "Biscuit", notes: "Senior ginger, on medication for kidneys." },
    ],
  });

  return NextResponse.json({ ok: true });
}
