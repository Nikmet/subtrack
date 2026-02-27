"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSubscriptionCategory } from "@/app/constants/subscription-categories";
import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const allowedPeriods = new Set([1, 3, 6, 12]);
const allowedReturnPaths = new Set(["/admin/moderation", "/admin/published", "/admin/users"]);

const parsePrice = (value: string): number | null => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const getReturnTo = (formData: FormData, fallback: string) => {
  const returnToRaw = formData.get("returnTo");
  const returnTo = typeof returnToRaw === "string" ? returnToRaw.trim() : "";

  if (allowedReturnPaths.has(returnTo)) {
    return returnTo;
  }

  return fallback;
};

const createNotificationForUsers = async (userIds: string[], title: string, message: string, kind: string) => {
  if (userIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      kind,
      title,
      message,
    })),
  });
};

const toAdminRedirect = (basePath: string, toastType: string, name?: string) => {
  const params = new URLSearchParams({ toast: toastType });
  if (name) {
    params.set("name", name);
  }
  return `${basePath}?${params.toString()}`;
};

const revalidateAdminData = () => {
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/published");
  revalidatePath("/admin/users");
  revalidatePath("/admin/banks");
  revalidatePath("/search");
  revalidatePath("/");
  revalidatePath("/subscriptions/pending");
};

export async function publishCommonSubscriptionAction(formData: FormData) {
  const admin = await requireAdminUser();
  const returnTo = getReturnTo(formData, "/admin/moderation");

  const commonSubscriptionIdRaw = formData.get("commonSubscriptionId");
  const moderationCommentRaw = formData.get("moderationComment");
  const commonSubscriptionId =
    typeof commonSubscriptionIdRaw === "string" ? commonSubscriptionIdRaw.trim() : "";
  const moderationComment =
    typeof moderationCommentRaw === "string" ? moderationCommentRaw.trim() : null;

  if (!commonSubscriptionId) {
    redirect(returnTo);
  }

  const subscription = await prisma.commonSubscription.update({
    where: { id: commonSubscriptionId },
    data: {
      status: "PUBLISHED",
      moderatedByUserId: admin.id,
      moderatedAt: new Date(),
      moderationComment,
    },
    select: {
      name: true,
      createdByUserId: true,
    },
  });

  if (subscription.createdByUserId) {
    await prisma.notification.create({
      data: {
        userId: subscription.createdByUserId,
        kind: "success",
        title: "Подписка опубликована",
        message: `Ваша заявка "${subscription.name}" прошла модерацию и опубликована.`,
      },
    });
  }

  revalidateAdminData();
  redirect(toAdminRedirect(returnTo, "published", subscription.name));
}

export async function deleteCommonSubscriptionAction(formData: FormData) {
  const admin = await requireAdminUser();

  const commonSubscriptionIdRaw = formData.get("commonSubscriptionId");
  const reasonRaw = formData.get("reason");
  const commonSubscriptionId =
    typeof commonSubscriptionIdRaw === "string" ? commonSubscriptionIdRaw.trim() : "";
  const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";

  if (!commonSubscriptionId || !reason) {
    redirect("/admin/moderation");
  }

  const subscription = await prisma.commonSubscription.findUnique({
    where: { id: commonSubscriptionId },
    select: {
      id: true,
      name: true,
      status: true,
      createdByUserId: true,
      subscriptions: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!subscription) {
    redirect("/admin/moderation");
  }

  const fallbackPath = subscription.status === "PUBLISHED" ? "/admin/published" : "/admin/moderation";
  const returnTo = getReturnTo(formData, fallbackPath);

  if (subscription.status === "PENDING") {
    await prisma.commonSubscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "REJECTED",
        moderatedByUserId: admin.id,
        moderatedAt: new Date(),
        moderationComment: reason,
      },
    });

    if (subscription.createdByUserId) {
      await prisma.notification.create({
        data: {
          userId: subscription.createdByUserId,
          kind: "warning",
          title: "Заявка отклонена",
          message: `Подписка "${subscription.name}" отклонена модератором. Причина: ${reason}.`,
        },
      });
    }

    revalidateAdminData();
    redirect(toAdminRedirect(returnTo, "rejected", subscription.name));
  }

  const affectedUserIds = [...new Set(subscription.subscriptions.map((item) => item.userId))];

  await prisma.commonSubscription.delete({
    where: {
      id: commonSubscriptionId,
    },
  });

  if (subscription.status === "PUBLISHED") {
    await createNotificationForUsers(
      affectedUserIds,
      "Подписка удалена",
      `Подписка "${subscription.name}" снята с публикации администратором. Причина: ${reason}.`,
      "warning",
    );
  }

  revalidateAdminData();
  redirect(toAdminRedirect(returnTo, "deleted", subscription.name));
}

export async function updateCommonSubscriptionAction(formData: FormData) {
  const admin = await requireAdminUser();

  const commonSubscriptionIdRaw = formData.get("commonSubscriptionId");
  const nameRaw = formData.get("name");
  const imgLinkRaw = formData.get("imgLink");
  const categoryRaw = formData.get("category");
  const priceRaw = formData.get("price");
  const periodRaw = formData.get("period");
  const moderationCommentRaw = formData.get("moderationComment");

  const commonSubscriptionId =
    typeof commonSubscriptionIdRaw === "string" ? commonSubscriptionIdRaw.trim() : "";
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  const imgLink = typeof imgLinkRaw === "string" ? imgLinkRaw.trim() : "";
  const category = typeof categoryRaw === "string" ? categoryRaw.trim() : "";
  const priceInput = typeof priceRaw === "string" ? priceRaw : "";
  const periodInput = typeof periodRaw === "string" ? periodRaw : "";
  const moderationComment =
    typeof moderationCommentRaw === "string" ? moderationCommentRaw.trim() : null;

  if (!commonSubscriptionId || name.length < 2) {
    redirect("/admin/published");
  }

  const price = parsePrice(priceInput);
  if (price === null) {
    redirect(`/admin/subscriptions/${encodeURIComponent(commonSubscriptionId)}`);
  }

  const period = Number(periodInput);
  if (!allowedPeriods.has(period)) {
    redirect(`/admin/subscriptions/${encodeURIComponent(commonSubscriptionId)}`);
  }

  if (!isSubscriptionCategory(category)) {
    redirect(`/admin/subscriptions/${encodeURIComponent(commonSubscriptionId)}`);
  }

  await prisma.commonSubscription.update({
    where: { id: commonSubscriptionId },
    data: {
      name,
      imgLink,
      category,
      price,
      period,
      moderatedByUserId: admin.id,
      moderatedAt: new Date(),
      moderationComment,
    },
  });

  revalidateAdminData();
  redirect("/admin/published");
}

export async function banUserAction(formData: FormData) {
  await requireAdminUser();
  const returnTo = getReturnTo(formData, "/admin/users");

  const userIdRaw = formData.get("userId");
  const reasonRaw = formData.get("reason");
  const userId = typeof userIdRaw === "string" ? userIdRaw.trim() : "";
  const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";

  if (!userId || !reason) {
    redirect(returnTo);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target || target.role === "ADMIN") {
    redirect(returnTo);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      banReason: reason,
      bannedAt: new Date(),
    },
  });

  revalidateAdminData();
  redirect(returnTo);
}

export async function unbanUserAction(formData: FormData) {
  await requireAdminUser();
  const returnTo = getReturnTo(formData, "/admin/users");

  const userIdRaw = formData.get("userId");
  const userId = typeof userIdRaw === "string" ? userIdRaw.trim() : "";

  if (!userId) {
    redirect(returnTo);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: false,
      banReason: null,
      bannedAt: null,
    },
  });

  revalidateAdminData();
  redirect(returnTo);
}
