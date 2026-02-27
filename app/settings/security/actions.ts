"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const normalizeText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const toPage = (toastType: string) => `/settings/security?toast=${encodeURIComponent(toastType)}`;

export async function changePasswordAction(formData: FormData) {
  const user = await getAuthorizedUser();

  const currentPassword = normalizeText(formData.get("currentPassword"));
  const newPassword = normalizeText(formData.get("newPassword"));
  const confirmPassword = normalizeText(formData.get("confirmPassword"));

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect(toPage("invalid"));
  }

  if (newPassword.length < 8) {
    redirect(toPage("weak"));
  }

  if (newPassword !== confirmPassword) {
    redirect(toPage("mismatch"));
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      password: true,
    },
  });

  if (!dbUser) {
    redirect(toPage("invalid"));
  }

  const isCurrentValid = await compare(currentPassword, dbUser.password);
  if (!isCurrentValid) {
    redirect(toPage("current_wrong"));
  }

  const passwordHash = await hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: passwordHash,
    },
  });

  redirect(toPage("changed"));
}
