"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type NewSubscriptionState = {
  error: string | null;
  needsDuplicateConfirm: boolean;
  duplicateMessage: string | null;
  confirmNonce: string | null;
};

const allowedPeriods = new Set([1, 3, 6, 12]);

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  )}₽`;

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
      needsDuplicateConfirm: false,
      duplicateMessage: null,
      confirmNonce: null,
    };
  }

  const typeIdRaw = formData.get("typeId");
  const customRaw = formData.get("custom");
  const confirmDuplicateRaw = formData.get("confirmDuplicate");
  const nameRaw = formData.get("name");
  const categoryIdRaw = formData.get("categoryId");
  const imgLinkRaw = formData.get("imgLink");
  const priceRaw = formData.get("price");
  const periodRaw = formData.get("period");
  const nextPaymentAtRaw = formData.get("nextPaymentAt");
  const paymentMethodRaw = formData.get("paymentMethodLabel");

  const typeId = typeof typeIdRaw === "string" ? typeIdRaw : "";
  const custom = typeof customRaw === "string" ? customRaw === "1" : !typeId;
  const confirmDuplicate =
    typeof confirmDuplicateRaw === "string" && confirmDuplicateRaw === "true";
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const categoryId = typeof categoryIdRaw === "string" ? categoryIdRaw : "";
  const imgLink = typeof imgLinkRaw === "string" ? imgLinkRaw.trim() : "";
  const priceInput = typeof priceRaw === "string" ? priceRaw : "";
  const periodInput = typeof periodRaw === "string" ? periodRaw : "";
  const nextPaymentInput =
    typeof nextPaymentAtRaw === "string" ? nextPaymentAtRaw : "";
  const paymentMethodLabel =
    typeof paymentMethodRaw === "string" ? paymentMethodRaw.trim() : "";

  const price = parsePrice(priceInput);
  if (price === null) {
    return {
      error: "Введите корректную стоимость подписки.",
      needsDuplicateConfirm: false,
      duplicateMessage: null,
      confirmNonce: null,
    };
  }

  const period = Number(periodInput);
  if (!allowedPeriods.has(period)) {
    return {
      error: "Выберите корректный период подписки.",
      needsDuplicateConfirm: false,
      duplicateMessage: null,
      confirmNonce: null,
    };
  }

  const nextPaymentAt = parseDate(nextPaymentInput);
  if (nextPaymentInput && !nextPaymentAt) {
    return {
      error: "Введите корректную дату ближайшей оплаты.",
      needsDuplicateConfirm: false,
      duplicateMessage: null,
      confirmNonce: null,
    };
  }

  let finalTypeId = typeId;

  if (custom || !typeId) {
    if (!name || name.length < 2) {
      return {
        error: "Введите название сервиса (минимум 2 символа).",
        needsDuplicateConfirm: false,
        duplicateMessage: null,
        confirmNonce: null,
      };
    }

    if (!categoryId) {
      return {
        error: "Выберите категорию сервиса.",
        needsDuplicateConfirm: false,
        duplicateMessage: null,
        confirmNonce: null,
      };
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return {
        error: "Категория не найдена. Обновите страницу и попробуйте снова.",
        needsDuplicateConfirm: false,
        duplicateMessage: null,
        confirmNonce: null,
      };
    }

    const existingType = await prisma.type.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingType) {
      finalTypeId = existingType.id;
    } else {
      const createdType = await prisma.type.create({
        data: {
          name,
          categoryId,
          link: "",
          imgLink,
        },
        select: { id: true },
      });

      finalTypeId = createdType.id;
    }
  } else {
    const existingType = await prisma.type.findUnique({
      where: { id: typeId },
      select: { id: true },
    });

    if (!existingType) {
      return {
        error: "Выбранная подписка не найдена.",
        needsDuplicateConfirm: false,
        duplicateMessage: null,
        confirmNonce: null,
      };
    }
  }

  const duplicate = await prisma.subscribe.findFirst({
    where: {
      userId,
      typeId: finalTypeId,
    },
    include: {
      type: { select: { name: true } },
    },
  });

  if (duplicate && !confirmDuplicate) {
    return {
      error: null,
      needsDuplicateConfirm: true,
      duplicateMessage: `Подписка "${duplicate.type.name}" уже есть у вас. Добавить еще одну?`,
      confirmNonce: `${Date.now()}`,
    };
  }

  await prisma.subscribe.create({
    data: {
      userId,
      typeId: finalTypeId,
      price,
      period,
      nextPaymentAt,
      paymentMethodLabel: paymentMethodLabel || null,
    },
  });

  const type = await prisma.type.findUnique({
    where: { id: finalTypeId },
    select: { name: true },
  });

  const typeName = type?.name ?? "подписку";

  await prisma.notification.create({
    data: {
      userId,
      kind: "neutral",
      title: "Новая подписка",
      message: `Вы успешно добавили ${typeName} в список.`,
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
          } будет списано ${formatRub(price)} за ${typeName}.`,
        },
      });
    }
  }

  redirect("/");
}
