import { describe, it, expect } from "vitest";
import { LogEntryInput, CatInput, LoginInput } from "../lib/validators";

describe("LogEntryInput", () => {
  const base = {
    catId: "cat_123",
    loggedByName: "Sarah",
    foodOffered: "SOME",
    waterIntake: "NORMAL",
    urinated: true,
    defecated: false,
    condition: "GOOD",
  };

  it("accepts a minimal valid entry with no bristol when defecated is false", () => {
    const result = LogEntryInput.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("requires loggedByName", () => {
    const { loggedByName: _omit, ...withoutName } = base;
    expect(LogEntryInput.safeParse(withoutName).success).toBe(false);
  });

  it("rejects empty or whitespace-only loggedByName", () => {
    expect(LogEntryInput.safeParse({ ...base, loggedByName: "" }).success).toBe(false);
    expect(LogEntryInput.safeParse({ ...base, loggedByName: "   " }).success).toBe(false);
  });

  it("trims loggedByName whitespace", () => {
    const result = LogEntryInput.safeParse({ ...base, loggedByName: "  Sarah  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.loggedByName).toBe("Sarah");
  });

  it("requires bristolScore when defecated is true", () => {
    const result = LogEntryInput.safeParse({ ...base, defecated: true });
    expect(result.success).toBe(false);
  });

  it("accepts bristolScore 1..7 when defecated", () => {
    for (const score of [1, 2, 3, 4, 5, 6, 7]) {
      const result = LogEntryInput.safeParse({
        ...base,
        defecated: true,
        bristolScore: score,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects bristolScore outside 1..7", () => {
    const tooLow = LogEntryInput.safeParse({ ...base, defecated: true, bristolScore: 0 });
    const tooHigh = LogEntryInput.safeParse({ ...base, defecated: true, bristolScore: 8 });
    expect(tooLow.success).toBe(false);
    expect(tooHigh.success).toBe(false);
  });

  it("rejects bristolScore when defecated is false (stale data)", () => {
    const result = LogEntryInput.safeParse({
      ...base,
      defecated: false,
      bristolScore: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid enum values", () => {
    expect(LogEntryInput.safeParse({ ...base, foodOffered: "LOTS" }).success).toBe(false);
    expect(LogEntryInput.safeParse({ ...base, waterIntake: "DRY" }).success).toBe(false);
    expect(LogEntryInput.safeParse({ ...base, condition: "MEH" }).success).toBe(false);
  });

  it("accepts optional weightGrams as positive integer", () => {
    const ok = LogEntryInput.safeParse({ ...base, weightGrams: 4200 });
    const bad = LogEntryInput.safeParse({ ...base, weightGrams: -1 });
    const frac = LogEntryInput.safeParse({ ...base, weightGrams: 4.5 });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
    expect(frac.success).toBe(false);
  });

  it("accepts optional notes", () => {
    const result = LogEntryInput.safeParse({
      ...base,
      behaviourNotes: "Playful, chased a toy.",
      generalNotes: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("CatInput", () => {
  it("accepts a name-only cat", () => {
    const result = CatInput.safeParse({ name: "Whiskers" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(CatInput.safeParse({ name: "" }).success).toBe(false);
    expect(CatInput.safeParse({ name: "   " }).success).toBe(false);
  });

  it("trims name whitespace", () => {
    const result = CatInput.safeParse({ name: "  Whiskers  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Whiskers");
  });
});

describe("LoginInput", () => {
  it("accepts a password", () => {
    const result = LoginInput.safeParse({ password: "anything" });
    expect(result.success).toBe(true);
  });
  it("rejects empty password", () => {
    const result = LoginInput.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });
});
