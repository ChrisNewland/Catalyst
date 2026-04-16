import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="mx-auto max-w-sm pt-8">
      <h1 className="text-2xl font-bold mb-2">Catalyst</h1>
      <p className="text-sm text-ink/60 mb-6">
        Enter the shelter password to sign in.
      </p>
      {error ? (
        <div
          data-testid="login-error"
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg bg-alarm/10 text-alarm p-3 text-sm"
        >
          Incorrect password.
        </div>
      ) : null}
      <LoginForm from={from ?? "/"} />
    </div>
  );
}
