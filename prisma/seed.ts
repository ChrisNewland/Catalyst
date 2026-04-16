import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.cat.count();
  if (existing === 0) {
    await prisma.cat.createMany({
      data: [
        { name: "Mittens", notes: "Friendly tabby, loves chin scratches." },
        { name: "Shadow", notes: "Shy black cat, hides under the cat tree." },
        { name: "Biscuit", notes: "Senior ginger, on medication for kidneys." },
      ],
    });
  }
  console.log("Seeded cats.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
