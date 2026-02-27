"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { formatPaymentMethodLabel, normalizeCardNumberInput } from "@/app/utils/payment-method-formatters";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const NEW_PAYMENT_METHOD_VALUE = "__new__";

const parseDate = (value: FormDataEntryValue | null): Date | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeCardNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeCardNumberInput(value);
};

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

const isValidCardNumber = (value: string) => value.length >= 4 && value.length <= 24;

const getOrCreatePaymentMethod = async (
  userId: string,
  paymentMethodIdInput: string,
  newPaymentMethodBankId: string,
  newPaymentMethodCardNumber: string,
) => {
  if (paymentMethodIdInput && paymentMethodIdInput !== NEW_PAYMENT_METHOD_VALUE) {
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodIdInput,
        userId,
      },
      select: {
        id: true,
        cardNumber: true,
        bank: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!paymentMethod) {
      return null;
    }

    return {
      id: paymentMethod.id,
      snapshotLabel: formatPaymentMethodLabel(paymentMethod.bank.name, paymentMethod.cardNumber),
    };
  }

  if (!newPaymentMethodBankId || !isValidCardNumber(newPaymentMethodCardNumber)) {
    return null;
  }

  const bank = await prisma.bank.findUnique({
    where: {
      id: newPaymentMethodBankId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!bank) {
    return null;
  }

  const existed = await prisma.paymentMethod.findFirst({
    where: {
      userId,
      cardNumber: {
        equals: newPaymentMethodCardNumber,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      cardNumber: true,
      bank: {
        select: {
          name: true,
        },
      },
    },
  });

  if (existed) {
    return {
      id: existed.id,
      snapshotLabel: formatPaymentMethodLabel(existed.bank.name, existed.cardNumber),
    };
  }

  const methodsCount = await prisma.paymentMethod.count({
    where: {
      userId,
    },
  });

  const created = await prisma.paymentMethod.create({
    data: {
      userId,
      bankId: bank.id,
      cardNumber: newPaymentMethodCardNumber,
      isDefault: methodsCount === 0,
    },
    select: {
      id: true,
      cardNumber: true,
      bank: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    id: created.id,
    snapshotLabel: formatPaymentMethodLabel(created.bank.name, created.cardNumber),
  };
};

export async function createUserSubscriptionAction(formData: FormData) {
  const user = await getAuthorizedUser();

  const commonSubscriptionIdRaw = formData.get("commonSubscriptionId");
  const nextPaymentAtRaw = formData.get("nextPaymentAt");
  const paymentMethodIdRaw = formData.get("paymentMethodId");
  const newPaymentMethodBankIdRaw = formData.get("newPaymentMethodBankId");
  const newPaymentMethodCardNumberRaw = formData.get("newPaymentMethodCardNumber");

  const commonSubscriptionId =
    typeof commonSubscriptionIdRaw === "string" ? commonSubscriptionIdRaw.trim() : "";
  const nextPaymentAt = parseDate(nextPaymentAtRaw);
  const paymentMethodIdInput =
    typeof paymentMethodIdRaw === "string" ? paymentMethodIdRaw.trim() : "";
  const newPaymentMethodBankId = normalizeText(newPaymentMethodBankIdRaw);
  const newPaymentMethodCardNumber = normalizeCardNumber(newPaymentMethodCardNumberRaw);

  if (!commonSubscriptionId || !nextPaymentAt) {
    redirect("/search");
  }

  const commonSubscription = await prisma.commonSubscription.findUnique({
    where: {
      id: commonSubscriptionId,
    },
    select: {
      id: true,
      name: true,
      price: true,
      status: true,
    },
  });

  if (!commonSubscription || commonSubscription.status !== "PUBLISHED") {
    revalidatePath("/search");
    redirect("/search");
  }

  const paymentMethod = await getOrCreatePaymentMethod(
    user.id,
    paymentMethodIdInput,
    newPaymentMethodBankId,
    newPaymentMethodCardNumber,
  );

  if (!paymentMethod) {
    revalidatePath("/search");
    redirect("/search");
  }

  const duplicate = await prisma.userSubscription.findUnique({
    where: {
      userId_commonSubscriptionId: {
        userId: user.id,
        commonSubscriptionId,
      },
    },
    select: { id: true },
  });

  if (duplicate) {
    revalidatePath("/");
    redirect(`/?toast=exists&name=${encodeURIComponent(commonSubscription.name)}`);
  }

  await prisma.userSubscription.create({
    data: {
      userId: user.id,
      commonSubscriptionId,
      paymentMethodId: paymentMethod.id,
      nextPaymentAt,
      paymentCardLabel: paymentMethod.snapshotLabel,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      kind: "success",
      title: "Подписка добавлена",
      message: `Вы добавили ${commonSubscription.name} в список подписок.`,
    },
  });

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
        userId: user.id,
        kind: "info",
        title: "Скоро списание",
        message: `${diffDays === 0 ? "Сегодня" : "Завтра"} будет списано ${formatRub(
          Number(commonSubscription.price.toString()),
        )} за ${commonSubscription.name}.`,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/settings/payment-methods");
  redirect(`/?toast=added&name=${encodeURIComponent(commonSubscription.name)}`);
}
