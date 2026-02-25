import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";
import { getSubscriptionCategoryLabel } from "@/app/constants/subscription-categories";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import styles from "./pending.module.css";

export const dynamic = "force-dynamic";

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

export default async function PendingSubscriptionsPage() {
  const user = await getAuthorizedUser();

  const pendingItems = await prisma.commonSubscription.findMany({
    where: {
      status: "PENDING",
      createdByUserId: user.id,
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
    },
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
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
                    {getSubscriptionCategoryLabel(item.category)} • {formatRub(Number(item.price.toString()))} /{" "}
                    {item.period} мес.
                  </p>
                  <p className={styles.status}>На модерации</p>
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
