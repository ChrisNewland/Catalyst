import type { NextAuthConfig } from "next-auth";

// Edge-safe subset: no Prisma, no bcrypt. Used by middleware.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: string }).role ?? "VOLUNTEER";
        token.uid = (user as { id?: string }).id ?? token.sub;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id =
          (token.uid as string) ?? token.sub ?? "";
        (session.user as { role?: string }).role =
          (token.role as string) ?? "VOLUNTEER";
      }
      return session;
    },
  },
};
