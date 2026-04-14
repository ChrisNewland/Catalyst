import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const volunteerPassword = await bcrypt.hash("volunteer1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@shelter.test" },
    update: {},
    create: {
      email: "admin@shelter.test",
      name: "Alex Admin",
      hashedPassword: adminPassword,
      role: "ADMIN",
    },
  });

  const volunteer = await prisma.user.upsert({
    where: { email: "vol@shelter.test" },
    update: {},
    create: {
      email: "vol@shelter.test",
      name: "Val Volunteer",
      hashedPassword: volunteerPassword,
      role: "VOLUNTEER",
    },
  });

  const existingCats = await prisma.cat.count();
  if (existingCats === 0) {
    await prisma.cat.createMany({
      data: [
        { name: "Mittens", notes: "Friendly tabby, loves chin scratches." },
        { name: "Shadow", notes: "Shy black cat, hides under the cat tree." },
        { name: "Biscuit", notes: "Senior ginger, on medication for kidneys." },
      ],
    });
  }

  console.log("Seeded:", { admin: admin.email, volunteer: volunteer.email });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
