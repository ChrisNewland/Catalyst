"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserInviteInput } from "@/lib/validators";

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") throw new Error("Forbidden");
}

export async function inviteUser(formData: FormData) {
  await assertAdmin();
  const parsed = UserInviteInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") ?? "VOLUNTEER",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { ok: false as const, error: "Email already registered." };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      hashedPassword: await bcrypt.hash(parsed.data.password, 10),
    },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function setRole(userId: string, role: "ADMIN" | "VOLUNTEER") {
  await assertAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
