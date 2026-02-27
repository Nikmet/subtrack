import Link from "next/link";

import { SubmitButton } from "@/app/components/forms/submit-button";
import { UserAvatar } from "@/app/components/user-avatar/user-avatar";
import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { banUserAction, unbanUserAction } from "../actions";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

type UsersPageProps = {
  searchParams: Promise<{
    q?: string;
    role?: string;
    ban?: string;
  }>;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireAdminUser();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const role = (params.role ?? "").trim();
  const ban = (params.ban ?? "").trim();

  const where: {
    OR?: Array<{ name?: { contains: string; mode: "insensitive" }; email?: { contains: string; mode: "insensitive" } }>;
    role?: "USER" | "ADMIN";
    isBanned?: boolean;
  } = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role === "USER" || role === "ADMIN") {
    where.role = role;
  }

  if (ban === "banned") {
    where.isBanned = true;
  }

  if (ban === "active") {
    where.isBanned = false;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      avatarLink: true,
      email: true,
      role: true,
      isBanned: true,
      banReason: true,
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
        <header className={styles.header}>
          <Link href="/admin" className={styles.backLink}>
            ← В админ-панель
          </Link>
          <h1 className={styles.title}>Пользователи</h1>
        </header>

        <form action="/admin/users" method="GET" className={styles.filtersPanel}>
          <input
            className={styles.input}
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Поиск по имени или email"
          />

          <div className={styles.filtersRow}>
            <select className={styles.input} name="role" defaultValue={role === "USER" || role === "ADMIN" ? role : ""}>
              <option value="">Все роли</option>
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Админ</option>
            </select>

            <select className={styles.input} name="ban" defaultValue={ban === "banned" || ban === "active" ? ban : ""}>
              <option value="">Любой статус бана</option>
              <option value="active">Активные</option>
              <option value="banned">Забаненные</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button type="submit" className={styles.publishButton}>
              Применить
            </button>
            <Link href="/admin/users" className={styles.editLink}>
              Сбросить
            </Link>
          </div>
        </form>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Список</h2>
          {users.length === 0 ? (
            <p className={styles.emptyText}>Пользователи не найдены.</p>
          ) : (
            <div className={styles.grid}>
              {users.map((item) => (
                <article key={item.id} className={styles.card}>
                  <div className={styles.cardTopRow}>
                    <UserAvatar
                      src={item.avatarLink}
                      name={item.name}
                      wrapperClassName={styles.userIconWrap}
                      imageClassName={styles.userIconImage}
                      fallbackClassName={styles.userIcon}
                      fallbackText={getInitials(item.name)}
                    />
                    <p className={styles.cardTitle}>
                      {item.name} {item.role === "ADMIN" ? "• ADMIN" : ""}
                    </p>
                  </div>
                  <p className={styles.cardMeta}>{item.email}</p>
                  <p className={styles.cardSubMeta}>Подписок: {item.subscriptions.length}</p>
                  {item.isBanned ? <p className={styles.bannedBadge}>Забанен: {item.banReason || "-"}</p> : null}

                  {item.role === "USER" ? (
                    item.isBanned ? (
                      <form action={unbanUserAction}>
                        <input type="hidden" name="userId" value={item.id} />
                        <input type="hidden" name="returnTo" value="/admin/users" />
                        <SubmitButton className={styles.publishButton} idleLabel="Разбанить" pendingLabel="Сохраняем..." />
                      </form>
                    ) : (
                      <form action={banUserAction} className={styles.inlineForm}>
                        <input type="hidden" name="userId" value={item.id} />
                        <input type="hidden" name="returnTo" value="/admin/users" />
                        <input name="reason" className={styles.input} type="text" placeholder="Причина бана" required />
                        <SubmitButton className={styles.deleteButton} idleLabel="Забанить" pendingLabel="Сохраняем..." />
                      </form>
                    )
                  ) : (
                    <p className={styles.cardSubMeta}>Администраторов банить нельзя.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
