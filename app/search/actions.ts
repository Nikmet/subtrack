"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const parseDate = (value: FormDataEntryValue | null): Date | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

export async function createUserSubscriptionAction(formData: FormData) {
  const user = await getAuthorizedUser();

  const commonSubscriptionIdRaw = formData.get("commonSubscriptionId");
  const nextPaymentAtRaw = formData.get("nextPaymentAt");
  const paymentCardLabelRaw = formData.get("paymentCardLabel");

  const commonSubscriptionId =
    typeof commonSubscriptionIdRaw === "string" ? commonSubscriptionIdRaw.trim() : "";
  const nextPaymentAt = parseDate(nextPaymentAtRaw);
  const paymentCardLabel =
    typeof paymentCardLabelRaw === "string" ? paymentCardLabelRaw.trim() : "";

  if (!commonSubscriptionId || !nextPaymentAt || !paymentCardLabel) {
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
      nextPaymentAt,
      paymentCardLabel,
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
  redirect(`/?toast=added&name=${encodeURIComponent(commonSubscription.name)}`);
}
