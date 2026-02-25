"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";

import { ADMIN_BOOTSTRAP_EMAIL } from "@/app/constants/auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export type RegisterState = {
  error: string | null;
};

const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const nameValue = formData.get("name");
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");

  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!name || !email || !password) {
    return { error: "Заполните имя, email и пароль." };
  }

  if (name.length < 2) {
    return { error: "Имя должно быть не короче 2 символов." };
  }

  if (!isEmailValid(email)) {
    return { error: "Введите корректный email." };
  }

  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов." };
  }

  const existedUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existedUser) {
    return { error: "Пользователь с таким email уже существует." };
  }

  const passwordHash = await hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: email === ADMIN_BOOTSTRAP_EMAIL ? "ADMIN" : "USER",
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });

    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Аккаунт создан, но войти не удалось. Попробуйте войти вручную." };
    }

    throw error;
  }
}
