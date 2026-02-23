import { OTHER_CATEGORY_NAME } from "@/app/constants/home";
import type { CategoryStat, HomeScreenData, SubscriptionListItem } from "@/app/types/home";
import { prisma } from "@/lib/prisma";

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? "")
        .join("");

const toMonthlyAmount = (price: number, period: number) => {
    const safePeriod = Math.max(period, 1);
    return price / safePeriod;
};

const buildCategoryStats = (items: SubscriptionListItem[]) => {
    const grouped = new Map<string, number>();

    for (const item of items) {
        const key = item.categoryName.trim() || OTHER_CATEGORY_NAME;
        grouped.set(key, (grouped.get(key) ?? 0) + item.monthlyPrice);
    }

    const sorted = [...grouped.entries()]
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

    let limited = sorted;

    if (sorted.length > 4) {
        const topThree = sorted.slice(0, 3);
        const tailAmount = sorted.slice(3).reduce((sum, item) => sum + item.amount, 0);

        const otherIndex = topThree.findIndex(item => item.name === OTHER_CATEGORY_NAME);
        if (otherIndex >= 0) {
            topThree[otherIndex] = {
                ...topThree[otherIndex],
                amount: topThree[otherIndex].amount + tailAmount
            };
            limited = topThree;
        } else {
            limited = [...topThree, { name: OTHER_CATEGORY_NAME, amount: tailAmount }];
        }
    }

    const total = limited.reduce((sum, item) => sum + item.amount, 0);
    const stats: CategoryStat[] = limited.map(item => ({
        name: item.name,
        amount: item.amount,
        share: total > 0 ? (item.amount / total) * 100 : 0
    }));

    return {
        stats,
        total
    };
};

export async function getHomeScreenData(userId: string): Promise<HomeScreenData | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            subscribes: {
                include: {
                    type: {
                        include: {
                            category: true
                        }
                    }
                },
                orderBy: [{ nextPaymentAt: "asc" }, { id: "asc" }]
            }
        }
    });

    if (!user) {
        return null;
    }

    const subscriptions: SubscriptionListItem[] = user.subscribes.map(item => {
        const price = Number(item.price.toString());
        const monthlyPrice = toMonthlyAmount(price, item.period);

        return {
            id: item.id,
            price,
            monthlyPrice,
            period: item.period,
            nextPaymentAt: item.nextPaymentAt,
            typeName: item.type.name,
            typeImage: item.type.imgLink ?? "",
            categoryName: item.type.category?.name ?? OTHER_CATEGORY_NAME
        };
    });

    const monthlyTotal = subscriptions.reduce((sum, item) => sum + item.monthlyPrice, 0);
    const { stats, total } = buildCategoryStats(subscriptions);

    return {
        userInitials: getInitials(user.name),
        monthlyTotal,
        subscriptionsCount: subscriptions.length,
        subscriptions,
        categoryStats: stats,
        categoryTotal: total
    };
}
