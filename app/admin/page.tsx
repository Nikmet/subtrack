import Link from "next/link";

import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import {
  banUserAction,
  deleteCommonSubscriptionAction,
  publishCommonSubscriptionAction,
  unbanUserAction,
} from "./actions";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

const formatRub = (value: number) =>
  `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

export default async function AdminPage() {
  await requireAdminUser();

  const [pendingSubscriptions, publishedSubscriptions, users] = await Promise.all([
    prisma.commonSubscription.findMany({
      where: { status: "PENDING" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        period: true,
        createdAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.commonSubscription.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        period: true,
        subscriptions: {
          select: { id: true },
        },
      },
      take: 120,
    }),
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        banReason: true,
        subscriptions: {
          select: { id: true },
        },
      },
      take: 200,
    }),
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/settings" className={styles.backLink}>
            ← В настройки
          </Link>
          <h1 className={styles.title}>Админ-панель</h1>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Очередь модерации</h2>
          {pendingSubscriptions.length === 0 ? (
            <p className={styles.emptyText}>Нет заявок в очереди.</p>
          ) : (
            <div className={styles.grid}>
              {pendingSubscriptions.map((item) => (
                <article key={item.id} className={styles.card}>
                  <p className={styles.cardTitle}>{item.name}</p>
                  <p className={styles.cardMeta}>
                    {item.category} • {formatRub(Number(item.price.toString()))} / {item.period} мес.
                  </p>
                  <p className={styles.cardSubMeta}>
                    Автор: {item.createdByUser?.name ?? "Неизвестно"} ({item.createdByUser?.email ?? "-"})
                  </p>

                  <form action={publishCommonSubscriptionAction} className={styles.inlineForm}>
                    <input type="hidden" name="commonSubscriptionId" value={item.id} />
                    <input
                      name="moderationComment"
                      className={styles.input}
                      type="text"
                      placeholder="Комментарий к публикации (необязательно)"
                    />
                    <button type="submit" className={styles.publishButton}>
                      Публиковать
                    </button>
                  </form>

                  <form action={deleteCommonSubscriptionAction} className={styles.inlineForm}>
                    <input type="hidden" name="commonSubscriptionId" value={item.id} />
                    <input
                      name="reason"
                      className={styles.input}
                      type="text"
                      placeholder="Причина отклонения"
                      required
                    />
                    <button type="submit" className={styles.deleteButton}>
                      Отклонить
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Опубликованные подписки</h2>
          <div className={styles.grid}>
            {publishedSubscriptions.map((item) => (
              <article key={item.id} className={styles.card}>
                <p className={styles.cardTitle}>{item.name}</p>
                <p className={styles.cardMeta}>
                  {item.category} • {formatRub(Number(item.price.toString()))} / {item.period} мес.
                </p>
                <p className={styles.cardSubMeta}>Пользователей: {item.subscriptions.length}</p>

                <div className={styles.actionsRow}>
                  <Link href={`/admin/subscriptions/${item.id}`} className={styles.editLink}>
                    Редактировать
                  </Link>
                </div>

                <form action={deleteCommonSubscriptionAction} className={styles.inlineForm}>
                  <input type="hidden" name="commonSubscriptionId" value={item.id} />
                  <input
                    name="reason"
                    className={styles.input}
                    type="text"
                    placeholder="Причина удаления"
                    required
                  />
                  <button type="submit" className={styles.deleteButton}>
                    Удалить
                  </button>
                </form>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Пользователи</h2>
          <div className={styles.grid}>
            {users.map((item) => (
              <article key={item.id} className={styles.card}>
                <p className={styles.cardTitle}>
                  {item.name} {item.role === "ADMIN" ? "• ADMIN" : ""}
                </p>
                <p className={styles.cardMeta}>{item.email}</p>
                <p className={styles.cardSubMeta}>Подписок: {item.subscriptions.length}</p>
                {item.isBanned ? <p className={styles.bannedBadge}>Забанен: {item.banReason || "-"}</p> : null}

                {item.role === "USER" ? (
                  item.isBanned ? (
                    <form action={unbanUserAction}>
                      <input type="hidden" name="userId" value={item.id} />
                      <button type="submit" className={styles.publishButton}>
                        Разбанить
                      </button>
                    </form>
                  ) : (
                    <form action={banUserAction} className={styles.inlineForm}>
                      <input type="hidden" name="userId" value={item.id} />
                      <input name="reason" className={styles.input} type="text" placeholder="Причина бана" required />
                      <button type="submit" className={styles.deleteButton}>
                        Забанить
                      </button>
                    </form>
                  )
                ) : (
                  <p className={styles.cardSubMeta}>Администраторов банить нельзя.</p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
