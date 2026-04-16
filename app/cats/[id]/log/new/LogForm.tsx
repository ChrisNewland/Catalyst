"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLogEntry } from "@/lib/actions/logEntry";

type Food = "NONE" | "SOME" | "ALL";
type Water = "NONE" | "SOME" | "NORMAL";
type Condition = "GOOD" | "CONCERN" | "URGENT";

const BRISTOL_LABELS: Record<number, string> = {
  1: "1 · Hard pellets",
  2: "2 · Lumpy",
  3: "3 · Cracked",
  4: "4 · Smooth",
  5: "5 · Soft blobs",
  6: "6 · Mushy",
  7: "7 · Liquid",
};

const NAME_STORAGE_KEY = "catalyst:loggedByName";

export default function LogForm({
  catId,
  catName,
}: {
  catId: string;
  catName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [loggedByName, setLoggedByName] = useState("");
  const [food, setFood] = useState<Food>("NONE");
  const [water, setWater] = useState<Water>("NONE");
  const [urinated, setUrinated] = useState(false);
  const [defecated, setDefecated] = useState(false);
  const [bristol, setBristol] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState<Condition>("GOOD");
  const [behaviourNotes, setBehaviourNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NAME_STORAGE_KEY);
      if (saved) setLoggedByName(saved);
    } catch {
      // localStorage may be unavailable in private browsing — not fatal.
    }
  }, []);

  function onDefecatedChange(next: boolean) {
    setDefecated(next);
    if (!next) setBristol(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = loggedByName.trim();
    if (!trimmedName) {
      setError("Please enter your name before saving.");
      return;
    }
    if (defecated && bristol === null) {
      setError("Bristol score is required when defecated is true.");
      return;
    }

    const payload = {
      catId,
      loggedByName: trimmedName,
      foodOffered: food,
      waterIntake: water,
      urinated,
      defecated,
      bristolScore: defecated && bristol !== null ? bristol : undefined,
      weightGrams: weight ? Number.parseInt(weight, 10) : undefined,
      condition,
      behaviourNotes: behaviourNotes.trim() || undefined,
      generalNotes: generalNotes.trim() || undefined,
    };

    startTransition(async () => {
      const result = await createLogEntry(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        window.localStorage.setItem(NAME_STORAGE_KEY, trimmedName);
      } catch {
        // ignore storage failures
      }
      const params = new URLSearchParams({ logged: catName });
      router.replace(`/?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <div
          data-testid="form-error"
          role="status"
          aria-live="polite"
          className="rounded-lg bg-alarm/10 text-alarm p-3 text-sm"
        >
          {error}
        </div>
      ) : null}

      <label className="field card">
        <span className="font-semibold">Logged by</span>
        <input
          type="text"
          name="loggedByName"
          data-testid="logged-by-name"
          autoComplete="name"
          value={loggedByName}
          onChange={(e) => setLoggedByName(e.target.value)}
          placeholder="Your name or initials"
          aria-required="true"
        />
      </label>

      <fieldset className="card">
        <legend className="font-semibold px-1">Food offered</legend>
        <div className="flex gap-2 mt-2">
          {(["NONE", "SOME", "ALL"] as const).map((v) => (
            <button
              key={v}
              type="button"
              data-testid={`food-${v}`}
              onClick={() => setFood(v)}
              aria-pressed={food === v}
              className={`chip flex-1 ${food === v ? "chip-on" : "chip-off"}`}
            >
              {titleCase(v)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="card">
        <legend className="font-semibold px-1">Water intake</legend>
        <div className="flex gap-2 mt-2">
          {(["NONE", "SOME", "NORMAL"] as const).map((v) => (
            <button
              key={v}
              type="button"
              data-testid={`water-${v}`}
              onClick={() => setWater(v)}
              aria-pressed={water === v}
              className={`chip flex-1 ${water === v ? "chip-on" : "chip-off"}`}
            >
              {titleCase(v)}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="card flex flex-col gap-3">
        <Toggle
          label="Urinated"
          value={urinated}
          testId="toggle-urinated"
          onChange={setUrinated}
        />
        <Toggle
          label="Defecated"
          value={defecated}
          testId="toggle-defecated"
          onChange={onDefecatedChange}
        />

        {defecated && (
          <div data-testid="bristol-picker">
            <div className="text-sm text-ink/70 mb-2">Bristol stool score</div>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  data-testid={`bristol-${n}`}
                  onClick={() => setBristol(n)}
                  aria-pressed={bristol === n}
                  aria-label={BRISTOL_LABELS[n]}
                  className={`chip ${bristol === n ? "chip-on" : "chip-off"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            {bristol !== null && (
              <p className="text-xs text-ink/60 mt-1">
                {BRISTOL_LABELS[bristol]}
              </p>
            )}
          </div>
        )}
      </div>

      <fieldset className="card">
        <legend className="font-semibold px-1">Condition</legend>
        <div className="flex gap-2 mt-2">
          {(["GOOD", "CONCERN", "URGENT"] as const).map((v) => (
            <button
              key={v}
              type="button"
              data-testid={`condition-${v}`}
              onClick={() => setCondition(v)}
              aria-pressed={condition === v}
              className={`chip flex-1 ${condition === v ? "chip-on" : "chip-off"}`}
            >
              {titleCase(v)}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field card">
        <span className="font-semibold">Weight (grams) — optional</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 4200"
        />
      </label>

      <label className="field card">
        <span className="font-semibold">Behaviour notes — optional</span>
        <textarea
          rows={2}
          value={behaviourNotes}
          onChange={(e) => setBehaviourNotes(e.target.value)}
          placeholder="Playful, sleepy, hid under the cat tree…"
        />
      </label>

      <label className="field card">
        <span className="font-semibold">General notes — optional</span>
        <textarea
          rows={2}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Anything else to flag"
        />
      </label>

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Saving…" : "Save visit"}
      </button>
    </form>
  );
}

function Toggle({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className="flex items-center justify-between w-full min-h-tap px-2"
    >
      <span className="font-medium">{label}</span>
      <span
        className={`h-7 w-12 rounded-full relative transition ${
          value ? "bg-moss" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

function titleCase(v: string) {
  return v[0] + v.slice(1).toLowerCase();
}
