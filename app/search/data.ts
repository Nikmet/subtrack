import { cache } from "react";

import {
  SUBSCRIPTION_CATEGORIES,
  getSubscriptionCategoryLabel,
  isSubscriptionCategory,
  type SubscriptionCategory,
} from "@/app/constants/subscription-categories";
import { prisma } from "@/lib/prisma";

type TypeWithStats = {
  id: string;
  name: string;
  imgLink: string;
  categoryName: string;
  categorySlug: SubscriptionCategory;
  suggestedMonthlyPrice: number | null;
  subscribersCount: number;
};

export type SearchCategory = {
  id: string;
  slug: SubscriptionCategory;
  name: string;
};

type AggregatedService = {
  id: string;
  name: string;
  imgLink: string;
  categorySlug: SubscriptionCategory;
  categoryName: string;
  suggestedMonthlyPrice: number | null;
  subscribersCount: number;
};

const toMonthlyAmount = (price: { toString(): string }, period: number) => {
  const numericPrice = Number(price.toString());
  const safePeriod = Math.max(period, 1);
  return numericPrice / safePeriod;
};

const getAggregatedServices = cache(async (): Promise<AggregatedService[]> => {
  const subscribes = await prisma.subscribe.findMany({
    select: {
      userId: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
    },
  });

  const grouped = new Map<
    string,
    {
      id: string;
      name: string;
      imgLink: string;
      categorySlug: SubscriptionCategory;
      monthlyTotal: number;
      monthlyCount: number;
      userIds: Set<string>;
    }
  >();

  for (const item of subscribes) {
    const name = item.name.trim();
    if (!name) {
      continue;
    }

    const imgLink = item.imgLink.trim();
    const key = `${name.toLocaleLowerCase("ru-RU")}::${item.category}::${imgLink}`;
    const existing = grouped.get(key);
    const monthly = toMonthlyAmount(item.price, item.period);

    if (!existing) {
      grouped.set(key, {
        id: key,
        name,
        imgLink,
        categorySlug: item.category,
        monthlyTotal: monthly,
        monthlyCount: 1,
        userIds: new Set([item.userId]),
      });
      continue;
    }

    existing.monthlyTotal += monthly;
    existing.monthlyCount += 1;
    existing.userIds.add(item.userId);
  }

  const services = [...grouped.values()].map((item) => ({
    id: item.id,
    name: item.name,
    imgLink: item.imgLink,
    categorySlug: item.categorySlug,
    categoryName: getSubscriptionCategoryLabel(item.categorySlug),
    suggestedMonthlyPrice: item.monthlyCount > 0 ? item.monthlyTotal / item.monthlyCount : null,
    subscribersCount: item.userIds.size,
  }));

  services.sort(
    (a, b) =>
      b.subscribersCount - a.subscribersCount ||
      a.name.localeCompare(b.name, "ru-RU", { sensitivity: "base" }),
  );

  return services;
});

export async function getCategories(): Promise<SearchCategory[]> {
  const services = await getAggregatedServices();
  const categoriesInUse = new Set(services.map((item) => item.categorySlug));

  return SUBSCRIPTION_CATEGORIES.filter((item) => categoriesInUse.has(item.value)).map((item) => ({
    id: item.value,
    slug: item.value,
    name: item.label,
  }));
}

export async function searchTypes(query: string, categorySlug?: string): Promise<TypeWithStats[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  const services = await getAggregatedServices();

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

export async function getPopularTypes(limit = 8): Promise<TypeWithStats[]> {
  const services = await getAggregatedServices();
  return services.slice(0, limit);
}
