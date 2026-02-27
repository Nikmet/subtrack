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

import { deleteCommonSubscriptionAction, publishCommonSubscriptionAction } from "../actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

type ModerationPageProps = {
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

export default async function ModerationPage({ searchParams }: ModerationPageProps) {
  await requireAdminUser();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const periodRaw = (params.period ?? "").trim();
  const period = Number(periodRaw);
  const hasPeriod = allowedPeriods.has(period);

  const where: Prisma.CommonSubscriptionWhereInput = {
    status: "PENDING",
  };

  if (isSubscriptionCategory(category)) {
    where.category = category;
  }

  if (hasPeriod) {
    where.period = period;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { createdByUser: { name: { contains: q, mode: "insensitive" } } },
      { createdByUser: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const pendingSubscriptions = await prisma.commonSubscription.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
      createdByUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 200,
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <AdminToastTrigger toastType={params.toast} name={params.name} redirectPath="/admin/moderation" />

        <header className={styles.header}>
          <Link href="/admin" className={styles.backLink}>
            ← В админ-панель
          </Link>
          <h1 className={styles.title}>Очередь модерации</h1>
        </header>

        <form action="/admin/moderation" method="GET" className={styles.filtersPanel}>
          <input
            className={styles.input}
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Поиск по названию, автору или email"
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
            <Link href="/admin/moderation" className={styles.editLink}>
              Сбросить
            </Link>
          </div>
        </form>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Заявки</h2>
          {pendingSubscriptions.length === 0 ? (
            <p className={styles.emptyText}>Нет заявок в очереди.</p>
          ) : (
            <div className={styles.grid}>
              {pendingSubscriptions.map((item) => (
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

                  <p className={styles.cardSubMeta}>
                    Автор: {item.createdByUser?.name ?? "Неизвестно"} ({item.createdByUser?.email ?? "-"})
                  </p>

                  <form action={publishCommonSubscriptionAction} className={styles.inlineForm}>
                    <input type="hidden" name="commonSubscriptionId" value={item.id} />
                    <input type="hidden" name="returnTo" value="/admin/moderation" />
                    <input
                      name="moderationComment"
                      className={styles.input}
                      type="text"
                      placeholder="Комментарий к публикации (необязательно)"
                    />
                    <SubmitButton className={styles.publishButton} idleLabel="Публиковать" pendingLabel="Публикуем..." />
                  </form>

                  <form action={deleteCommonSubscriptionAction} className={styles.inlineForm}>
                    <input type="hidden" name="commonSubscriptionId" value={item.id} />
                    <input type="hidden" name="returnTo" value="/admin/moderation" />
                    <input
                      name="reason"
                      className={styles.input}
                      type="text"
                      placeholder="Причина отклонения"
                      required
                    />
                    <SubmitButton className={styles.deleteButton} idleLabel="Отклонить" pendingLabel="Сохраняем..." />
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
