"use server";

import { redirect } from "next/navigation";

import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  isSubscriptionCategory,
} from "@/app/constants/subscription-categories";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type NewSubscriptionState = {
  error: string | null;
};

const allowedPeriods = new Set([1, 3, 6, 12]);

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

const parsePrice = (value: string): number | null => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function createSubscriptionAction(
  _prevState: NewSubscriptionState,
  formData: FormData,
): Promise<NewSubscriptionState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      error: "Требуется авторизация.",
    };
  }

  const nameRaw = formData.get("name");
  const categoryRaw = formData.get("category");
  const imgLinkRaw = formData.get("imgLink");
  const priceRaw = formData.get("price");
  const periodRaw = formData.get("period");
  const nextPaymentAtRaw = formData.get("nextPaymentAt");
  const paymentMethodRaw = formData.get("paymentMethodLabel");

  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const imgLink = typeof imgLinkRaw === "string" ? imgLinkRaw.trim() : "";
  const category =
    typeof categoryRaw === "string" && isSubscriptionCategory(categoryRaw)
      ? categoryRaw
      : DEFAULT_SUBSCRIPTION_CATEGORY;
  const priceInput = typeof priceRaw === "string" ? priceRaw : "";
  const periodInput = typeof periodRaw === "string" ? periodRaw : "";
  const nextPaymentInput =
    typeof nextPaymentAtRaw === "string" ? nextPaymentAtRaw : "";
  const paymentMethodLabel =
    typeof paymentMethodRaw === "string" ? paymentMethodRaw.trim() : "";

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

  const nextPaymentAt = parseDate(nextPaymentInput);
  if (nextPaymentInput && !nextPaymentAt) {
    return {
      error: "Введите корректную дату ближайшей оплаты.",
    };
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
    return {
      error: `Подписка "${name}" уже есть у вас в списке.`,
    };
  }

  await prisma.subscribe.create({
    data: {
      userId,
      name,
      imgLink,
      category,
      price,
      period,
      nextPaymentAt,
      paymentMethodLabel: paymentMethodLabel || null,
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      kind: "neutral",
      title: "Новая подписка",
      message: `Вы успешно добавили ${name} в список.`,
    },
  });

  if (nextPaymentAt) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfPaymentDate = new Date(
      nextPaymentAt.getFullYear(),
      nextPaymentAt.getMonth(),
      nextPaymentAt.getDate(),
    );
    const diffDays = Math.floor(
      (startOfPaymentDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0 || diffDays === 1) {
      await prisma.notification.create({
        data: {
          userId,
          kind: "info",
          title: "Скоро списание",
          message: `${
            diffDays === 0 ? "Сегодня" : "Завтра"
          } будет списано ${formatRub(price)} за ${name}.`,
        },
      });
    }
  }

  redirect("/");
}
