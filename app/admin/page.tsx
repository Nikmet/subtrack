import Link from "next/link";

import { requireAdminUser } from "@/lib/auth-guards";

import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

const adminAreas = [
  {
    href: "/admin/moderation",
    title: "Очередь модерации",
    description: "Проверка новых подписок, публикация и отклонение.",
  },
  {
    href: "/admin/published",
    title: "Опубликованные",
    description: "Редактирование и удаление уже опубликованных подписок.",
  },
  {
    href: "/admin/users",
    title: "Пользователи",
    description: "Блокировка и разблокировка пользователей.",
  },
  {
    href: "/admin/banks",
    title: "Банки",
    description: "Справочник банков и их иконок для способов оплаты.",
  },
];

export default async function AdminPage() {
  await requireAdminUser();

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
          <h2 className={styles.sectionTitle}>Области</h2>
          <div className={styles.areaGrid}>
            {adminAreas.map((area) => (
              <Link key={area.href} href={area.href} className={styles.areaLink}>
                <p className={styles.cardTitle}>{area.title}</p>
                <p className={styles.areaDescription}>{area.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
