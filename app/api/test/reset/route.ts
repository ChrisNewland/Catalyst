import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// Test-only database reset. Disabled in production.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not available", { status: 404 });
  }

  await prisma.logEntry.deleteMany();
  await prisma.cat.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash("admin1234", 10);
  const volunteerPassword = await bcrypt.hash("volunteer1234", 10);

  await prisma.user.create({
    data: {
      email: "admin@shelter.test",
      name: "Alex Admin",
      hashedPassword: adminPassword,
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      email: "vol@shelter.test",
      name: "Val Volunteer",
      hashedPassword: volunteerPassword,
      role: "VOLUNTEER",
    },
  });

  await prisma.cat.createMany({
    data: [
      { name: "Mittens", notes: "Friendly tabby, loves chin scratches." },
      { name: "Shadow", notes: "Shy black cat, hides under the cat tree." },
      { name: "Biscuit", notes: "Senior ginger, on medication for kidneys." },
    ],
  });

  return NextResponse.json({ ok: true });
}
