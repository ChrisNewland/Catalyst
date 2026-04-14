"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { LogEntryInput } from "@/lib/validators";

export type CreateLogEntryResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createLogEntry(
  raw: unknown,
): Promise<CreateLogEntryResult> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  const parsed = LogEntryInput.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input.",
    };
  }

  const data = parsed.data;

  const cat = await prisma.cat.findUnique({ where: { id: data.catId } });
  if (!cat || cat.archivedAt) {
    return { ok: false, error: "Cat not found." };
  }

  await prisma.logEntry.create({
    data: {
      catId: data.catId,
      volunteerId: userId,
      foodOffered: data.foodOffered,
      waterIntake: data.waterIntake,
      urinated: data.urinated,
      defecated: data.defecated,
      bristolScore: data.defecated ? (data.bristolScore ?? null) : null,
      weightGrams: data.weightGrams ?? null,
      condition: data.condition,
      behaviourNotes: data.behaviourNotes ?? null,
      generalNotes: data.generalNotes ?? null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/cats/${data.catId}`);
  return { ok: true };
}
