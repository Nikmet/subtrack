"use server";

import { AuthError } from "next-auth";

import { ADMIN_BOOTSTRAP_EMAIL, DEFAULT_BAN_REASON } from "@/app/constants/auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { error: "Введите email и пароль." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      isBanned: true,
      banReason: true,
    },
  });

  if (user?.isBanned) {
    return { error: user.banReason?.trim() || DEFAULT_BAN_REASON };
  }

  if (user && email === ADMIN_BOOTSTRAP_EMAIL && user.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });

    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Неверный email или пароль." };
      }

      return { error: "Не удалось выполнить вход. Попробуйте снова." };
    }

    throw error;
  }
}
