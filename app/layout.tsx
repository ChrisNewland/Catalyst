import "./globals.css";
import type { Metadata, Viewport } from "next";
import { auth } from "@/auth";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import PageTransition from "@/components/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Cat } from "lucide-react";

export const metadata: Metadata = {
  title: "Catalyst — cat shelter daily log",
  description: "Fast daily visit logging for shelter cats.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
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
          <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
            <div className="mx-auto max-w-screen-sm flex items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-lg p-1.5">
                  <Cat className="h-5 w-5" />
                </span>
                <span className="font-bold text-lg text-foreground">
                  Catalyst
                </span>
              </Link>
              <nav className="flex items-center gap-3 text-sm">
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin/cats"
                    className="text-mauve-dark font-medium hover:text-primary transition-colors"
                  >
                    Manage cats
                  </Link>
                )}
                <Badge
                  variant="secondary"
                  data-testid="role-badge"
                >
                  {user.role === "ADMIN" ? "Admin" : "Volunteer"}
                </Badge>
                <SignOutButton />
              </nav>
            </div>
          </header>
        ) : null}
        <main className="mx-auto max-w-screen-sm p-4">
          <PageTransition>{children}</PageTransition>
        </main>
      </body>
    </html>
  );
}
