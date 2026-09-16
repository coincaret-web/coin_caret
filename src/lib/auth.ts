import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/modules/identity/repository/user.repository";
import { verifyPassword } from "@/modules/identity/service/auth.service";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Coin Caret Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@coincaret.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide both email and password.");
        }

        const user = (await findUserByEmail(credentials.email)) as any;
        if (!user || !user.passwordHash) {
          throw new Error("Invalid email address or password.");
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email address or password.");
        }

        const role = user.roles?.[0]?.role?.name ?? "USER";

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "coin_caret_development_nextauth_secret_key_3847_mainnet",
};
