import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { ADMIN_BOOTSTRAP_EMAIL } from "@/app/constants/auth";
import { prisma } from "@/lib/prisma";

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            isBanned: true,
            banReason: true,
          },
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          return null;
        }

        if (user.isBanned) {
          return null;
        }

        let role = user.role;
        if (user.email === ADMIN_BOOTSTRAP_EMAIL && user.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
          role = "ADMIN";
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
          isBanned: user.isBanned,
          banReason: user.banReason,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isBanned = user.isBanned;
        token.banReason = user.banReason;
      }

      const tokenUserId = typeof token.id === "string" ? token.id : null;
      if (!tokenUserId) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: tokenUserId },
        select: {
          id: true,
          email: true,
          role: true,
          isBanned: true,
          banReason: true,
        },
      });

      if (!dbUser) {
        return token;
      }

      if (dbUser.email === ADMIN_BOOTSTRAP_EMAIL && dbUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: "ADMIN" },
        });
        token.role = "ADMIN";
      } else {
        token.role = dbUser.role;
      }

      token.isBanned = dbUser.isBanned;
      token.banReason = dbUser.banReason;

      return token;
    },
    async session({ session, token }) {
      const tokenUserId = typeof token.id === "string" ? token.id : null;

      if (session.user && tokenUserId) {
        session.user.id = tokenUserId;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
        session.user.isBanned = token.isBanned === true;
        session.user.banReason =
          typeof token.banReason === "string" ? token.banReason : null;
      }

      return session;
    },
    authorized({ request, auth }) {
      const isAuthorized = Boolean(auth?.user);
      const isBanned = auth?.user?.isBanned === true;
      const pathname = request.nextUrl.pathname;
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isAuthPage && isAuthorized && !isBanned) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      if (isAuthPage) {
        return true;
      }

      return isAuthorized && !isBanned;
    },
  },
});
