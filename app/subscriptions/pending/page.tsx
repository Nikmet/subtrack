import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";
import { PendingToastTrigger } from "@/app/components/toast/pending-toast-trigger";
import { getSubscriptionCategoryLabel } from "@/app/constants/subscription-categories";
import { formatPeriodLabel } from "@/app/utils/subscription-formatters";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import styles from "./pending.module.css";

export const dynamic = "force-dynamic";

type PendingSubscriptionsPageProps = {
  searchParams: Promise<{
    toast?: string;
    name?: string;
  }>;
};

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

const statusMap: Record<"PENDING" | "PUBLISHED" | "REJECTED", string> = {
  PENDING: "На модерации",
  PUBLISHED: "Опубликовано",
  REJECTED: "Отклонено",
};

const statusClassMap: Record<"PENDING" | "PUBLISHED" | "REJECTED", string> = {
  PENDING: styles.statusPending,
  PUBLISHED: styles.statusPublished,
  REJECTED: styles.statusRejected,
};

export default async function PendingSubscriptionsPage({ searchParams }: PendingSubscriptionsPageProps) {
  const user = await getAuthorizedUser();
  const params = await searchParams;

  const pendingItems = await prisma.commonSubscription.findMany({
    where: {
      createdByUserId: user.id,
      status: {
        in: ["PENDING", "PUBLISHED", "REJECTED"],
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
      createdAt: true,
      moderationComment: true,
      status: true,
    },
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <PendingToastTrigger toastType={params.toast} name={params.name} />

        <header className={styles.header}>
          <Link href="/profile" className={styles.backButton} aria-label="Назад в профиль">
            ‹
          </Link>
          <h1 className={styles.title}>Мои заявки</h1>
          <span className={styles.spacer} />
        </header>

        {pendingItems.length === 0 ? (
          <section className={styles.emptyCard}>
            <p className={styles.emptyText}>У вас пока нет заявок на публикацию.</p>
            <Link href="/subscriptions/new" className={styles.emptyAction}>
              Создать общую подписку
            </Link>
          </section>
        ) : (
          <section className={styles.list}>
            {pendingItems.map((item) => (
              <article key={item.id} className={styles.card}>
                <SubscriptionIcon
                  src={item.imgLink}
                  name={item.name}
                  wrapperClassName={styles.iconWrap}
                  imageClassName={styles.iconImage}
                  fallbackClassName={styles.iconFallback}
                />
                <div className={styles.main}>
                  <p className={styles.name}>{item.name}</p>
                  <p className={styles.meta}>
                    {getSubscriptionCategoryLabel(item.category)} • {formatRub(Number(item.price.toString()))} • {formatPeriodLabel(item.period)}
                  </p>
                  <p className={`${styles.status} ${statusClassMap[item.status]}`}>{statusMap[item.status]}</p>
                  {item.moderationComment ? <p className={styles.comment}>Комментарий: {item.moderationComment}</p> : null}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <AppMenu />
    </main>
  );
}
