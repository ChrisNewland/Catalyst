import { z } from "zod";

export const FoodOffered = z.enum(["NONE", "SOME", "ALL"]);
export const WaterIntake = z.enum(["NONE", "SOME", "NORMAL"]);
export const Condition = z.enum(["GOOD", "CONCERN", "URGENT"]);
export const Role = z.enum(["VOLUNTEER", "ADMIN"]);

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const LogEntryInput = z
  .object({
    catId: z.string().min(1),
    foodOffered: FoodOffered,
    waterIntake: WaterIntake,
    urinated: z.boolean(),
    defecated: z.boolean(),
    bristolScore: z.number().int().min(1).max(7).optional(),
    weightGrams: z.number().int().positive().optional(),
    condition: Condition,
    behaviourNotes: optionalTrimmed,
    generalNotes: optionalTrimmed,
  })
  .superRefine((v, ctx) => {
    if (v.defecated && (v.bristolScore === undefined || v.bristolScore === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bristolScore"],
        message: "Bristol score is required when defecated is true",
      });
    }
    if (!v.defecated && v.bristolScore !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bristolScore"],
        message: "Bristol score should not be set when defecated is false",
      });
    }
  });
export type LogEntryInput = z.infer<typeof LogEntryInput>;

export const CatInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required"),
  notes: z.string().trim().optional().default(""),
  medicalFlags: z.string().trim().optional().default(""),
});
export type CatInput = z.infer<typeof CatInput>;

export const UserInviteInput = z.object({
  email: z.string().email(),
  name: z.string().trim().min(1),
  role: Role,
  password: z.string().min(8),
});
export type UserInviteInput = z.infer<typeof UserInviteInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;
