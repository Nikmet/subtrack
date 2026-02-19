import { prisma } from "@/lib/prisma";

type TypeWithStats = {
  id: string;
  name: string;
  imgLink: string;
  categoryName: string;
  categorySlug: string;
  suggestedMonthlyPrice: number | null;
  subscribersCount: number;
};

export type SearchCategory = {
  id: string;
  slug: string;
  name: string;
};

const getSuggestedMonthlyPrice = (
  subscribes: Array<{ price: { toString(): string }; period: number }>,
): number | null => {
  if (subscribes.length === 0) {
    return null;
  }

  const monthlySum = subscribes.reduce((sum, item) => {
    const numericPrice = Number(item.price.toString());
    const period = Math.max(item.period, 1);
    return sum + numericPrice / period;
  }, 0);

  return monthlySum / subscribes.length;
};

const mapTypeWithStats = (
  type: {
    id: string;
    name: string;
    imgLink: string;
    category: { name: string; slug: string };
    subscribes: Array<{ price: { toString(): string }; period: number }>;
    _count: { subscribes: number };
  },
): TypeWithStats => ({
  id: type.id,
  name: type.name,
  imgLink: type.imgLink,
  categoryName: type.category.name,
  categorySlug: type.category.slug,
  suggestedMonthlyPrice: getSuggestedMonthlyPrice(type.subscribes),
  subscribersCount: type._count.subscribes,
});

export async function getCategories(): Promise<SearchCategory[]> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

export async function searchTypes(
  query: string,
  categorySlug?: string,
): Promise<TypeWithStats[]> {
  const normalizedQuery = query.trim();

  const where =
    normalizedQuery || categorySlug
      ? {
          AND: [
            categorySlug
              ? {
                  category: {
                    slug: categorySlug,
                  },
                }
              : {},
            normalizedQuery
              ? {
                  OR: [
                    {
                      name: {
                        contains: normalizedQuery,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      category: {
                        name: {
                          contains: normalizedQuery,
                          mode: "insensitive" as const,
                        },
                      },
                    },
                  ],
                }
              : {},
          ],
        }
      : undefined;

  const types = await prisma.type.findMany({
    where,
    orderBy: [{ subscribes: { _count: "desc" } }, { name: "asc" }],
    include: {
      category: {
        select: { slug: true, name: true },
      },
      subscribes: {
        select: {
          price: true,
          period: true,
        },
      },
      _count: {
        select: {
          subscribes: true,
        },
      },
    },
    take: 30,
  });

  return types.map(mapTypeWithStats);
}

export async function getPopularTypes(limit = 8): Promise<TypeWithStats[]> {
  const types = await prisma.type.findMany({
    orderBy: [{ subscribes: { _count: "desc" } }, { name: "asc" }],
    include: {
      category: {
        select: { slug: true, name: true },
      },
      subscribes: {
        select: {
          price: true,
          period: true,
        },
      },
      _count: {
        select: {
          subscribes: true,
        },
      },
    },
    take: limit,
  });

  return types.map(mapTypeWithStats);
}
