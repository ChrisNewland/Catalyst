import { describe, it, expect } from "vitest";
import {
  LogEntryInput,
  CatInput,
  UserInviteInput,
  LoginInput,
} from "../lib/validators";

describe("LogEntryInput", () => {
  const base = {
    catId: "cat_123",
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

describe("UserInviteInput", () => {
  it("accepts valid email + name + role + password", () => {
    const result = UserInviteInput.safeParse({
      email: "new@shelter.test",
      name: "New Volunteer",
      role: "VOLUNTEER",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = UserInviteInput.safeParse({
      email: "not-an-email",
      name: "X",
      role: "VOLUNTEER",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = UserInviteInput.safeParse({
      email: "ok@shelter.test",
      name: "X",
      role: "VOLUNTEER",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = UserInviteInput.safeParse({
      email: "ok@shelter.test",
      name: "X",
      role: "SUPERUSER",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginInput", () => {
  it("accepts valid email + password", () => {
    const result = LoginInput.safeParse({
      email: "a@b.test",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });
  it("rejects empty password", () => {
    const result = LoginInput.safeParse({ email: "a@b.test", password: "" });
    expect(result.success).toBe(false);
  });
});
