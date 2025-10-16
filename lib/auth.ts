// فایل: lib/auth.ts

import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Adapter } from "next-auth/adapters"; // ۱. Adapter را از next-auth ایمپورت کنید

export const authOptions: NextAuthOptions = {
  // --- شروع تغییر ---
  adapter: PrismaAdapter(db) as Adapter, // ۲. با استفاده از as Adapter به TypeScript می‌گوییم که نوع را بپذیرد
  // --- پایان تغییر ---
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };