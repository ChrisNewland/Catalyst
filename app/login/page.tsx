import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="mx-auto max-w-sm pt-8">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      {error ? (
        <div
          data-testid="login-error"
          role="status"
          aria-live="polite"
          className="mb-4 rounded-lg bg-alarm/10 text-alarm p-3 text-sm"
        >
          Invalid email or password.
        </div>
      ) : null}
      <LoginForm from={from ?? "/"} />
      <p className="text-xs text-ink/60 mt-6">
        Seeded logins for development: <br />
        admin@shelter.test / admin1234 <br />
        vol@shelter.test / volunteer1234
      </p>
    </div>
  );
}
