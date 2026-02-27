"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const toPage = (toastType: string) => `/settings/profile?toast=${encodeURIComponent(toastType)}`;

const isValidAvatarLink = (value: string) => {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export async function updateProfileAction(formData: FormData) {
  const user = await getAuthorizedUser();

  const name = normalizeText(formData.get("name"));
  const email = normalizeText(formData.get("email")).toLowerCase();
  const avatarLinkRaw = normalizeText(formData.get("avatarLink"));
  const avatarLink = avatarLinkRaw || null;

  if (name.length < 2 || !isEmailValid(email) || !isValidAvatarLink(avatarLinkRaw)) {
    redirect(toPage("invalid"));
  }

  const existed = await prisma.user.findFirst({
    where: {
      email,
      id: {
        not: user.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existed) {
    redirect(toPage("email_exists"));
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
      email,
      avatarLink,
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/settings/profile");
  revalidatePath("/admin/users");
  redirect(toPage("saved"));
}
