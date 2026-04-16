import "./globals.css";
import type { Metadata, Viewport } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export const metadata: Metadata = {
  title: "Catalyst — cat shelter daily log",
  description: "Fast daily visit logging for shelter cats.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fdfaf3",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  return (
    <html lang="en">
      <body className="min-h-dvh">
        {user ? (
          <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-ink/10">
            <div className="mx-auto max-w-screen-sm flex items-center justify-between px-4 py-2">
              <Link href="/" className="font-bold text-lg text-moss">
                Catalyst
              </Link>
              <nav className="flex items-center gap-3 text-sm">
                {user.role === "ADMIN" && (
                  <Link href="/admin/cats" className="underline">
                    Cats
                  </Link>
                )}
                <span
                  className="text-ink/60"
                  data-testid="role-badge"
                >
                  {user.role === "ADMIN" ? "Admin" : "Volunteer"}
                </span>
                <SignOutButton />
              </nav>
            </div>
          </header>
        ) : null}
        <main className="mx-auto max-w-screen-sm p-4">{children}</main>
      </body>
    </html>
  );
}
