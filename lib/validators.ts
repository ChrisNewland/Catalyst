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

const trimmedNonEmpty = (field: string) =>
  z.string({ required_error: `${field} is required` }).trim().min(1, `${field} is required`);

export const LogEntryInput = z
  .object({
    catId: z.string().min(1),
    loggedByName: trimmedNonEmpty("Logged by"),
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
  name: trimmedNonEmpty("Name"),
  notes: z.string().trim().optional().default(""),
  medicalFlags: z.string().trim().optional().default(""),
});
export type CatInput = z.infer<typeof CatInput>;

export const LoginInput = z.object({
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;
