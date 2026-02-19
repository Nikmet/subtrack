import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
        });

        if (!user) {
          return null;
        }

        const isValidPassword = await compare(password, user.password);
        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      const tokenUserId = typeof token.id === "string" ? token.id : null;

      if (session.user && tokenUserId) {
        session.user.id = tokenUserId;
      }

      return session;
    },
    authorized({ request, auth }) {
      const isAuthorized = Boolean(auth?.user);
      const pathname = request.nextUrl.pathname;
      const isAuthPage = pathname === "/login" || pathname === "/register";

      if (isAuthPage && isAuthorized) {
        return Response.redirect(new URL("/", request.nextUrl));
      }

      if (isAuthPage) {
        return true;
      }

      return isAuthorized;
    },
  },
});
