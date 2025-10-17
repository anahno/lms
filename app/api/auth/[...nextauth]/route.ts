// فایل: app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; // ۱. وارد کردن CredentialsProvider
import bcrypt from "bcryptjs"; // ۲. وارد کردن bcrypt برای مقایسه رمز عبور

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // ارائه‌دهنده ورود با گوگل (بدون تغییر)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ۳. اضافه کردن ارائه‌دهنده برای ورود با ایمیل و رمز عبور
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // این تابع مسئول اعتبارسنجی کاربر است
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("ایمیل و رمز عبور الزامی است.");
        }

        // پیدا کردن کاربر در دیتابیس
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        // اگر کاربر پیدا نشد یا رمز عبور نداشت (مثلا با گوگل ثبت‌نام کرده)
        if (!user || !user.password) {
          throw new Error("کاربری با این مشخصات یافت نشد.");
        }

        // مقایسه رمز عبور وارد شده با رمز عبور هش شده در دیتابیس
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("ایمیل یا رمز عبور اشتباه است.");
        }

        // اگر همه چیز درست بود، آبجکت کاربر را برگردان
        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
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
  pages: {
    signIn: "/login", // ۴. مشخص کردن صفحه ورود سفارشی
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };