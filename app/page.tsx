import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";

import { auth } from "@/auth";
import { AppMenu } from "@/app/components/app-menu";
import { SubscriptionIcon } from "@/app/components/subscription-icon";
import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SubscriptionListItem = {
  id: string;
  price: number;
  monthlyPrice: number;
  period: number;
  nextPaymentAt: Date | null;
  typeName: string;
  typeImage: string;
  categoryName: string;
};

type CategoryStat = {
  name: string;
  amount: number;
  share: number;
};

type ScreenData = {
  userInitials: string;
  monthlyTotal: number;
  subscriptionsCount: number;
  subscriptions: SubscriptionListItem[];
  categoryStats: CategoryStat[];
  categoryTotal: number;
};

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))} ₽`;

const formatNextPayment = (value: Date | null) => {
  if (!value) {
    return "дата списания не указана";
  }

  return `следующий платеж ${new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(value)}`;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const toMonthlyAmount = (price: number, period: number) => {
  const safePeriod = Math.max(period, 1);
  return price / safePeriod;
};

const formatSubscriptionCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} активная подписка`;
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} активные подписки`;
  }

  return `${count} активных подписок`;
};

const buildCategoryStats = (items: SubscriptionListItem[]) => {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const key = item.categoryName.trim() || "Прочее";
    grouped.set(key, (grouped.get(key) ?? 0) + item.monthlyPrice);
  }

  const sorted = [...grouped.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  let limited = sorted;

  if (sorted.length > 4) {
    const topThree = sorted.slice(0, 3);
    const tailAmount = sorted.slice(3).reduce((sum, item) => sum + item.amount, 0);

    const otherIndex = topThree.findIndex((item) => item.name === "Прочее");
    if (otherIndex >= 0) {
      topThree[otherIndex] = {
        ...topThree[otherIndex],
        amount: topThree[otherIndex].amount + tailAmount,
      };
      limited = topThree;
    } else {
      limited = [...topThree, { name: "Прочее", amount: tailAmount }];
    }
  }

  const total = limited.reduce((sum, item) => sum + item.amount, 0);
  const stats: CategoryStat[] = limited.map((item) => ({
    name: item.name,
    amount: item.amount,
    share: total > 0 ? (item.amount / total) * 100 : 0,
  }));

  return {
    stats,
    total,
  };
};

async function getScreenData(userId: string): Promise<ScreenData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscribes: {
        include: {
          type: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [{ nextPaymentAt: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!user) {
    return null;
  }

  const subscriptions: SubscriptionListItem[] = user.subscribes.map((item) => {
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
      categoryName: item.type.category?.name ?? "Прочее",
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
    categoryTotal: total,
  };
}

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12 4a5 5 0 0 0-5 5v2.8c0 .5-.2 1-.5 1.4L5 15h14l-1.5-1.8a2 2 0 0 1-.5-1.4V9a5 5 0 0 0-5-5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const screenData = await getScreenData(userId);

  if (!screenData) {
    redirect("/login");
  }

  const barColors = ["#39cfc2", "#4f8df0", "#f3b442", "#97a6b8"];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <div className={styles.headerBlock}>
            <h1 className={styles.pageTitle}>Домашняя</h1>
            <p className={styles.pageSubtitle}>Ваши подписки и платежи</p>
          </div>

          <div className={styles.topActions}>
            <Link
              href="/notifications"
              className={styles.notifyButton}
              aria-label="Открыть уведомления"
            >
              <BellIcon />
            </Link>
            <Link href="/profile" className={styles.avatarLink} aria-label="Профиль">
              <span className={styles.avatar}>{screenData.userInitials || "?"}</span>
            </Link>
          </div>
        </header>

        <div className={styles.layout}>
          <div className={styles.leftColumn}>
            <aside className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Ежемесячные расходы</p>
              <div className={styles.summaryAmountRow}>
                <p className={styles.summaryAmount}>{formatRub(screenData.monthlyTotal)}</p>
                <span className={styles.summaryPerMonth}>/мес</span>
              </div>
              <div className={styles.summaryBadge}>
                <span className={styles.summaryBadgeDot} aria-hidden />
                {formatSubscriptionCount(screenData.subscriptionsCount)}
              </div>
            </aside>

            <section className={styles.subscriptionsSection}>
              <h2 className={styles.sectionTitle}>Мои подписки</h2>

              {screenData.subscriptions.length > 0 ? (
                <div className={styles.subscriptionsList}>
                  {screenData.subscriptions.map((item) => (
                    <article key={item.id} className={styles.subscriptionCard}>
                      <SubscriptionIcon
                        src={item.typeImage}
                        name={item.typeName}
                        wrapperClassName={styles.subscriptionIconWrap}
                        imageClassName={styles.subscriptionIcon}
                        fallbackClassName={styles.subscriptionFallback}
                      />

                      <div className={styles.subscriptionMain}>
                        <h3 className={styles.subscriptionName}>{item.typeName}</h3>
                        <p className={styles.subscriptionMeta}>
                          {item.categoryName} • {formatNextPayment(item.nextPaymentAt)}
                        </p>
                      </div>

                      <div className={styles.subscriptionPriceBlock}>
                        <p className={styles.subscriptionPrice}>{formatRub(item.monthlyPrice)}</p>
                        <p className={styles.subscriptionPriceLabel}>в месяц</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  Подписок пока нет. Добавьте первую подписку через поиск.
                </div>
              )}
            </section>
          </div>

          <aside className={styles.rightColumn}>
            <section className={styles.categorySection}>
              <div className={styles.analyticsHeader}>
                <h2 className={styles.analyticsTitle}>Аналитика</h2>
                <p className={styles.analyticsTotal}>{formatRub(screenData.categoryTotal)} /мес</p>
              </div>

              {screenData.categoryStats.length > 0 ? (
                <div className={styles.categoryList}>
                  {screenData.categoryStats.map((item, index) => (
                    <article key={item.name} className={styles.categoryItem}>
                      <div className={styles.categoryHead}>
                        <p className={styles.categoryName}>{item.name}</p>
                        <p className={styles.categoryValue}>{formatRub(item.amount)}</p>
                      </div>
                      <div className={styles.progressTrack} aria-hidden>
                        <div
                          className={styles.progressFill}
                          style={
                            {
                              width: `${Math.max(0, Math.min(item.share, 100))}%`,
                              "--bar-color": barColors[index % barColors.length],
                            } as CSSProperties
                          }
                        />
                      </div>
                      <p className={styles.categoryShare}>
                        {Math.round(item.share)}% от общих расходов
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={styles.categoryEmpty}>
                  <p className={styles.categoryEmptyText}>
                    Добавьте подписки, чтобы увидеть структуру расходов по категориям.
                  </p>
                  <Link href="/search" className={styles.categoryEmptyLink}>
                    Добавить подписку
                  </Link>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <AppMenu />
    </main>
  );
}
