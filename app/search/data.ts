import { cache } from "react";

import {
  SUBSCRIPTION_CATEGORIES,
  getSubscriptionCategoryLabel,
  isSubscriptionCategory,
  type SubscriptionCategory,
} from "@/app/constants/subscription-categories";
import { prisma } from "@/lib/prisma";

export type SearchSubscriptionItem = {
  id: string;
  name: string;
  imgLink: string;
  categoryName: string;
  categorySlug: SubscriptionCategory;
  suggestedMonthlyPrice: number | null;
  subscribersCount: number;
  price: number;
  period: number;
};

export type SearchCategory = {
  id: string;
  slug: SubscriptionCategory;
  name: string;
};

const toMonthlyAmount = (price: { toString(): string }, period: number) => {
  const numericPrice = Number(price.toString());
  const safePeriod = Math.max(period, 1);
  return numericPrice / safePeriod;
};

const getCatalog = cache(async (): Promise<SearchSubscriptionItem[]> => {
  const subscriptions = await prisma.commonSubscription.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
      subscriptions: {
        where: {
          user: {
            isBanned: false,
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  return subscriptions
    .map((item) => {
      const price = Number(item.price.toString());
      const period = Math.max(item.period, 1);

      return {
        id: item.id,
        name: item.name.trim(),
        imgLink: item.imgLink.trim(),
        categorySlug: item.category,
        categoryName: getSubscriptionCategoryLabel(item.category),
        price,
        period,
        suggestedMonthlyPrice: toMonthlyAmount(item.price, period),
        subscribersCount: item.subscriptions.length,
      } satisfies SearchSubscriptionItem;
    })
    .filter((item) => item.name.length > 0)
    .sort(
      (a, b) =>
        b.subscribersCount - a.subscribersCount ||
        a.name.localeCompare(b.name, "ru-RU", { sensitivity: "base" }),
    );
});

export async function getCategories(): Promise<SearchCategory[]> {
  const services = await getCatalog();
  const categoriesInUse = new Set(services.map((item) => item.categorySlug));

  return SUBSCRIPTION_CATEGORIES.filter((item) => categoriesInUse.has(item.value)).map((item) => ({
    id: item.value,
    slug: item.value,
    name: item.label,
  }));
}

export async function searchTypes(
  query: string,
  categorySlug?: string,
): Promise<SearchSubscriptionItem[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  const services = await getCatalog();

  const byCategory =
    typeof categorySlug === "string" && isSubscriptionCategory(categorySlug)
      ? services.filter((item) => item.categorySlug === categorySlug)
      : services;

  const filtered =
    normalizedQuery.length === 0
      ? byCategory
      : byCategory.filter((item) => {
          const name = item.name.toLocaleLowerCase("ru-RU");
          const categoryName = item.categoryName.toLocaleLowerCase("ru-RU");
          return name.includes(normalizedQuery) || categoryName.includes(normalizedQuery);
        });

  return filtered.slice(0, 30);
}

export async function getPopularTypes(limit = 8): Promise<SearchSubscriptionItem[]> {
  const services = await getCatalog();
  return services.slice(0, limit);
}

export async function getTypeById(
  id: string,
  includeUnpublishedForAdmin = false,
): Promise<SearchSubscriptionItem | null> {
  if (!id.trim()) {
    return null;
  }

  const item = await prisma.commonSubscription.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
      status: true,
      subscriptions: {
        where: {
          user: {
            isBanned: false,
          },
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!item) {
    return null;
  }

  if (item.status !== "PUBLISHED" && !includeUnpublishedForAdmin) {
    return null;
  }

  const period = Math.max(item.period, 1);

  return {
    id: item.id,
    name: item.name.trim(),
    imgLink: item.imgLink.trim(),
    categorySlug: item.category,
    categoryName: getSubscriptionCategoryLabel(item.category),
    price: Number(item.price.toString()),
    period,
    suggestedMonthlyPrice: toMonthlyAmount(item.price, period),
    subscribersCount: item.subscriptions.length,
  };
}
