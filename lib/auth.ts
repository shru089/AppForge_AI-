import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";

const hasValidDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("host:5432");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(hasValidDb ? { adapter: PrismaAdapter(db) } : {}),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo_client_secret",
    }),
    Nodemailer({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@appforge.ai",
    }),
    CredentialsProvider({
      name: "Demo Login",
      credentials: {},
      async authorize() {
        // Bypass the database entirely for the demo login
        // to prevent connection errors if DATABASE_URL is not set.
        return {
          id: "demo-user-123",
          name: "Demo User",
          email: "demo@appforge.ai"
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
