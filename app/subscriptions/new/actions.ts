"use server";

import { redirect } from "next/navigation";

import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  isSubscriptionCategory,
} from "@/app/constants/subscription-categories";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export type NewSubscriptionState = {
  error: string | null;
};

const allowedPeriods = new Set([1, 3, 6, 12]);

const parsePrice = (value: string): number | null => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

export async function createCommonSubscriptionAction(
  _prevState: NewSubscriptionState,
  formData: FormData,
): Promise<NewSubscriptionState> {
  const user = await getAuthorizedUser();

  const nameRaw = formData.get("name");
  const categoryRaw = formData.get("category");
  const imgLinkRaw = formData.get("imgLink");
  const priceRaw = formData.get("price");
  const periodRaw = formData.get("period");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const imgLink = typeof imgLinkRaw === "string" ? imgLinkRaw.trim() : "";
  const category =
    typeof categoryRaw === "string" && isSubscriptionCategory(categoryRaw)
      ? categoryRaw
      : DEFAULT_SUBSCRIPTION_CATEGORY;
  const priceInput = typeof priceRaw === "string" ? priceRaw : "";
  const periodInput = typeof periodRaw === "string" ? periodRaw : "";

  if (!name || name.length < 2) {
    return {
      error: "Введите название сервиса (минимум 2 символа).",
    };
  }

  const price = parsePrice(priceInput);
  if (price === null) {
    return {
      error: "Введите корректную стоимость подписки.",
    };
  }

  const period = Number(periodInput);
  if (!allowedPeriods.has(period)) {
    return {
      error: "Выберите корректный период подписки.",
    };
  }

  await prisma.commonSubscription.create({
    data: {
      name,
      imgLink,
      category,
      price,
      period,
      status: "PENDING",
      createdByUserId: user.id,
    },
  });

  redirect("/subscriptions/pending");
}
