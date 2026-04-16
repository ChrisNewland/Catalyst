"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm({ from }: { from: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Incorrect password.");
        return;
      }
      router.replace(from || "/");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error ? (
        <div
          data-testid="login-error"
          role="status"
          aria-live="polite"
          className="rounded-lg bg-alarm/10 text-alarm p-3 text-sm"
        >
          {error}
        </div>
      ) : null}
      <label className="field">
        Shelter password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="btn-primary mt-2"
        disabled={isPending}
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
