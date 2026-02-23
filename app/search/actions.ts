"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  isSubscriptionCategory,
} from "@/app/constants/subscription-categories";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_MONTHLY_PRICE = 299;

const parseMonthlyPrice = (value: FormDataEntryValue | null): number => {
  if (typeof value !== "string") {
    return DEFAULT_MONTHLY_PRICE;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MONTHLY_PRICE;
  }

  return parsed;
};

export async function quickAddSubscriptionAction(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const nameRaw = formData.get("name");
  const imgLinkRaw = formData.get("imgLink");
  const categoryRaw = formData.get("category");
  const suggestedMonthlyPriceRaw = formData.get("suggestedMonthlyPrice");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const imgLink = typeof imgLinkRaw === "string" ? imgLinkRaw.trim() : "";
  const category =
    typeof categoryRaw === "string" && isSubscriptionCategory(categoryRaw)
      ? categoryRaw
      : DEFAULT_SUBSCRIPTION_CATEGORY;
  const price = parseMonthlyPrice(suggestedMonthlyPriceRaw);

  if (!name || name.length < 2) {
    redirect("/search");
  }

  const duplicate = await prisma.subscribe.findFirst({
    where: {
      userId,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    revalidatePath("/");
    redirect(`/?toast=exists&name=${encodeURIComponent(name)}`);
  }

  await prisma.subscribe.create({
    data: {
      userId,
      name,
      imgLink,
      category,
      price,
      period: 1,
      nextPaymentAt: null,
      paymentMethodLabel: null,
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      kind: "success",
      title: "Подписка добавлена",
      message: `Вы добавили ${name} в список подписок.`,
    },
  });

  revalidatePath("/");
  revalidatePath("/search");
  redirect(`/?toast=added&name=${encodeURIComponent(name)}`);
}
