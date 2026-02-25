import Link from "next/link";
import { notFound } from "next/navigation";

import { SUBSCRIPTION_CATEGORIES } from "@/app/constants/subscription-categories";
import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { updateCommonSubscriptionAction } from "../../actions";
import styles from "./edit-subscription.module.css";

export const dynamic = "force-dynamic";

type AdminEditSubscriptionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditSubscriptionPage({ params }: AdminEditSubscriptionPageProps) {
  await requireAdminUser();

  const { id } = await params;

  const item = await prisma.commonSubscription.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      imgLink: true,
      category: true,
      price: true,
      period: true,
      moderationComment: true,
      status: true,
    },
  });

  if (!item) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/admin" className={styles.backLink}>
            ← Назад в админку
          </Link>
          <h1 className={styles.title}>Редактирование подписки</h1>
        </header>

        <form action={updateCommonSubscriptionAction} className={styles.form}>
          <input type="hidden" name="commonSubscriptionId" value={item.id} />

          <label className={styles.label} htmlFor="name">
            Название
          </label>
          <input className={styles.input} id="name" name="name" defaultValue={item.name} required />

          <label className={styles.label} htmlFor="imgLink">
            URL иконки
          </label>
          <input className={styles.input} id="imgLink" name="imgLink" defaultValue={item.imgLink} required />

          <label className={styles.label} htmlFor="category">
            Категория
          </label>
          <select className={styles.input} id="category" name="category" defaultValue={item.category} required>
            {SUBSCRIPTION_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <label className={styles.label} htmlFor="price">
            Стоимость
          </label>
          <input
            className={styles.input}
            id="price"
            type="number"
            name="price"
            step="0.01"
            min="0.01"
            defaultValue={Number(item.price.toString())}
            required
          />

          <label className={styles.label} htmlFor="period">
            Период
          </label>
          <select className={styles.input} id="period" name="period" defaultValue={String(item.period)} required>
            <option value="1">Ежемесячно</option>
            <option value="3">Раз в 3 месяца</option>
            <option value="6">Раз в 6 месяцев</option>
            <option value="12">Раз в год</option>
          </select>

          <label className={styles.label} htmlFor="moderationComment">
            Комментарий модерации
          </label>
          <textarea
            className={styles.textarea}
            id="moderationComment"
            name="moderationComment"
            defaultValue={item.moderationComment ?? ""}
            rows={3}
          />

          <button type="submit" className={styles.submitButton}>
            Сохранить изменения
          </button>
        </form>
      </div>
    </main>
  );
}
