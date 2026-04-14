"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { CatInput } from "@/lib/validators";

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Forbidden");
}

export async function createCat(formData: FormData) {
  await assertAdmin();
  const parsed = CatInput.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") ?? "",
    medicalFlags: formData.get("medicalFlags") ?? "",
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }
  await prisma.cat.create({
    data: {
      name: parsed.data.name,
      notes: parsed.data.notes ?? "",
      medicalFlags: parsed.data.medicalFlags ?? "",
    },
  });
  revalidatePath("/admin/cats");
  revalidatePath("/");
  return { ok: true as const };
}

export async function archiveCat(catId: string) {
  await assertAdmin();
  await prisma.cat.update({
    where: { id: catId },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/admin/cats");
  revalidatePath("/");
}

export async function unarchiveCat(catId: string) {
  await assertAdmin();
  await prisma.cat.update({
    where: { id: catId },
    data: { archivedAt: null },
  });
  revalidatePath("/admin/cats");
  revalidatePath("/");
}
