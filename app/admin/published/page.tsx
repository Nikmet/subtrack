import Link from "next/link";

import { SubmitButton } from "@/app/components/forms/submit-button";
import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";
import { AdminToastTrigger } from "@/app/components/toast/admin-toast-trigger";
import {
  SUBSCRIPTION_CATEGORIES,
  getSubscriptionCategoryLabel,
  isSubscriptionCategory,
} from "@/app/constants/subscription-categories";
import type { Prisma } from "@/app/generated/prisma/client";
import { formatPeriodLabel } from "@/app/utils/subscription-formatters";
import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { deleteCommonSubscriptionAction } from "../actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

type PublishedPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    period?: string;
    toast?: string;
    name?: string;
  }>;
};

const allowedPeriods = new Set([1, 3, 6, 12]);

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

export default async function PublishedPage({ searchParams }: PublishedPageProps) {
  await requireAdminUser();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const periodRaw = (params.period ?? "").trim();
  const period = Number(periodRaw);
  const hasPeriod = allowedPeriods.has(period);

  const where: Prisma.CommonSubscriptionWhereInput = {
    status: "PUBLISHED",
  };

  if (isSubscriptionCategory(category)) {
    where.category = category;
  }

  if (hasPeriod) {
    where.period = period;
  }

  if (q) {
    where.OR = [{ name: { contains: q, mode: "insensitive" } }];
  }

  const publishedSubscriptions = await prisma.commonSubscription.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
      subscriptions: {
        select: {
          id: true,
        },
      },
    },
    take: 250,
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AdminToastTrigger toastType={params.toast} name={params.name} redirectPath="/admin/published" />

        <header className={styles.header}>
          <Link href="/admin" className={styles.backLink}>
            ← В админ-панель
          </Link>
          <h1 className={styles.title}>Опубликованные подписки</h1>
        </header>

        <form action="/admin/published" method="GET" className={styles.filtersPanel}>
          <input
            className={styles.input}
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию"
          />

          <div className={styles.filtersRow}>
            <select className={styles.input} name="category" defaultValue={category}>
              <option value="">Все категории</option>
              {SUBSCRIPTION_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select className={styles.input} name="period" defaultValue={hasPeriod ? String(period) : ""}>
              <option value="">Любой период</option>
              <option value="1">Ежемесячно</option>
              <option value="3">Раз в 3 месяца</option>
              <option value="6">Раз в 6 месяцев</option>
              <option value="12">Раз в год</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.publishButton}>
              Применить
            </button>
            <Link href="/admin/published" className={styles.editLink}>
              Сбросить
            </Link>
          </div>
        </form>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Каталог</h2>
          {publishedSubscriptions.length === 0 ? (
            <p className={styles.emptyText}>Пока нет опубликованных подписок.</p>
          ) : (
            <div className={styles.grid}>
              {publishedSubscriptions.map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardTopRow}>
                    <SubscriptionIcon
                      src={item.imgLink}
                      name={item.name}
                      wrapperClassName={styles.cardIconWrap}
                      imageClassName={styles.cardIconImage}
                      fallbackClassName={styles.cardIconFallback}
                    />
                    <p className={styles.cardTitle}>{item.name}</p>
                  </div>

                  <p className={styles.cardMeta}>
                    {getSubscriptionCategoryLabel(item.category)} • {formatRub(Number(item.price.toString()))} •{" "}
                    {formatPeriodLabel(item.period)}
                  </p>
                  <p className={styles.cardSubMeta}>Пользователей: {item.subscriptions.length}</p>

                  <div className={styles.actionsRow}>
                    <Link href={`/admin/subscriptions/${item.id}`} className={styles.editLink}>
                      Редактировать
                    </Link>
                  </div>

                  <form action={deleteCommonSubscriptionAction} className={styles.inlineForm}>
                    <input type="hidden" name="commonSubscriptionId" value={item.id} />
                    <input type="hidden" name="returnTo" value="/admin/published" />
                    <input
                      name="reason"
                      className={styles.input}
                      type="text"
                      placeholder="Причина удаления"
                      required
                    />
                    <SubmitButton className={styles.deleteButton} idleLabel="Удалить" pendingLabel="Удаляем..." />
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
