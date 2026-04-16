import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { LoginInput } from "@/lib/validators";
import { authConfig } from "@/auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = LoginInput.safeParse(raw);
        if (!parsed.success) return null;
        const { password } = parsed.data;

        const adminPassword = process.env.SHELTER_ADMIN_PASSWORD;
        const volunteerPassword = process.env.SHELTER_VOLUNTEER_PASSWORD;

        if (adminPassword && password === adminPassword) {
          return {
            id: "shelter-admin",
            name: "Shelter admin",
            role: "ADMIN",
          };
        }
        if (volunteerPassword && password === volunteerPassword) {
          return {
            id: "shelter-volunteer",
            name: "Shelter volunteer",
            role: "VOLUNTEER",
          };
        }
        return null;
      },
    }),
  ],
});
