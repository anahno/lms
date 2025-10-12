// فایل: app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth"; // NextAuthOptions را اضافه کنید
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// --- این بخش کلیدی است ---
// تمام تنظیمات را داخل یک متغیر قابل export قرار می‌دهیم
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "ایمیل", type: "email" },
        password: { label: "رمز عبور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          return null;
        }
        const passwordsMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (passwordsMatch) {
          return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// حالا از این آبجکت برای ساخت handler استفاده می‌کنیم
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };