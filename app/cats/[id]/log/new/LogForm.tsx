"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLogEntry } from "@/lib/actions/logEntry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Food = "NONE" | "SOME" | "ALL";
type Water = "NONE" | "SOME" | "NORMAL";
type Condition = "GOOD" | "CONCERN" | "URGENT";

const BRISTOL_LABELS: Record<number, string> = {
  1: "1 \u00b7 Hard pellets",
  2: "2 \u00b7 Lumpy",
  3: "3 \u00b7 Cracked",
  4: "4 \u00b7 Smooth",
  5: "5 \u00b7 Soft blobs",
  6: "6 \u00b7 Mushy",
  7: "7 \u00b7 Liquid",
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
      // localStorage may be unavailable
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
        // ignore
      }
      const params = new URLSearchParams({ logged: catName });
      router.replace(`/?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <div
          data-testid="form-error"
          role="status"
          aria-live="polite"
          className="rounded-xl bg-destructive/10 text-destructive p-3 text-sm"
        >
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-5">
          <Label htmlFor="loggedByName" className="font-semibold">
            Logged by
          </Label>
          <Input
            id="loggedByName"
            name="loggedByName"
            data-testid="logged-by-name"
            autoComplete="name"
            aria-required="true"
            value={loggedByName}
            onChange={(e) => setLoggedByName(e.target.value)}
            placeholder="Your name or initials"
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Label className="font-semibold">Food offered</Label>
          <div className="flex gap-2 mt-3">
            {(["NONE", "SOME", "ALL"] as const).map((v) => (
              <ChipButton
                key={v}
                testId={`food-${v}`}
                active={food === v}
                onClick={() => setFood(v)}
              >
                {titleCase(v)}
              </ChipButton>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Label className="font-semibold">Water intake</Label>
          <div className="flex gap-2 mt-3">
            {(["NONE", "SOME", "NORMAL"] as const).map((v) => (
              <ChipButton
                key={v}
                testId={`water-${v}`}
                active={water === v}
                onClick={() => setWater(v)}
              >
                {titleCase(v)}
              </ChipButton>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between min-h-tap">
            <Label htmlFor="switch-urinated" className="font-semibold cursor-pointer">
              Urinated
            </Label>
            <Switch
              id="switch-urinated"
              data-testid="toggle-urinated"
              checked={urinated}
              onCheckedChange={setUrinated}
            />
          </div>

          <div className="flex items-center justify-between min-h-tap">
            <Label htmlFor="switch-defecated" className="font-semibold cursor-pointer">
              Defecated
            </Label>
            <Switch
              id="switch-defecated"
              data-testid="toggle-defecated"
              checked={defecated}
              onCheckedChange={onDefecatedChange}
            />
          </div>

          {defecated && (
            <div data-testid="bristol-picker">
              <Label className="text-muted-foreground text-sm">
                Bristol stool score
              </Label>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <button
                    key={n}
                    type="button"
                    data-testid={`bristol-${n}`}
                    onClick={() => setBristol(n)}
                    aria-pressed={bristol === n}
                    aria-label={BRISTOL_LABELS[n]}
                    className={cn(
                      "rounded-xl min-h-tap min-w-tap text-sm font-semibold border transition-colors",
                      bristol === n
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {bristol !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {BRISTOL_LABELS[bristol]}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Label className="font-semibold">Condition</Label>
          <div className="flex gap-2 mt-3">
            {(
              [
                { v: "GOOD" as const, color: "bg-teal text-teal-dark border-teal" },
                { v: "CONCERN" as const, color: "bg-peach text-peach-dark border-peach" },
                { v: "URGENT" as const, color: "bg-destructive/15 text-destructive border-destructive/30" },
              ] as const
            ).map(({ v, color }) => (
              <button
                key={v}
                type="button"
                data-testid={`condition-${v}`}
                onClick={() => setCondition(v)}
                aria-pressed={condition === v}
                className={cn(
                  "flex-1 rounded-xl min-h-tap text-sm font-semibold border transition-colors",
                  condition === v
                    ? color
                    : "bg-background text-foreground border-input hover:bg-muted"
                )}
              >
                {titleCase(v)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Label htmlFor="weight" className="font-semibold">
            Weight (grams) — optional
          </Label>
          <Input
            id="weight"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 4200"
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Label htmlFor="behaviourNotes" className="font-semibold">
            Behaviour notes — optional
          </Label>
          <Textarea
            id="behaviourNotes"
            rows={2}
            value={behaviourNotes}
            onChange={(e) => setBehaviourNotes(e.target.value)}
            placeholder="Playful, sleepy, hid under the cat tree…"
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <Label htmlFor="generalNotes" className="font-semibold">
            General notes — optional
          </Label>
          <Textarea
            id="generalNotes"
            rows={2}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Anything else to flag"
            className="mt-2"
          />
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving…" : "Save visit"}
      </Button>
    </form>
  );
}

function ChipButton({
  children,
  active,
  onClick,
  testId,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 rounded-xl min-h-tap text-sm font-semibold border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-foreground border-input hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

function titleCase(v: string) {
  return v[0] + v.slice(1).toLowerCase();
}
