import LoginForm from "./LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cat } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error, from } = await searchParams;

  return (
    <div className="mx-auto max-w-sm pt-12">
      <div className="flex flex-col items-center mb-8">
        <span className="bg-primary text-primary-foreground rounded-2xl p-3 mb-4">
          <Cat className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold">Catalyst</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cat shelter daily log
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-base">
            Enter the shelter password to sign in
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div
              data-testid="login-error"
              role="status"
              aria-live="polite"
              className="mb-4 rounded-xl bg-destructive/10 text-destructive p-3 text-sm"
            >
              Incorrect password.
            </div>
          ) : null}
          <LoginForm from={from ?? "/"} />
        </CardContent>
      </Card>
    </div>
  );
}
