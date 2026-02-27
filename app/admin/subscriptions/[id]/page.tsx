import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { EditSubscriptionForm } from "./edit-subscription-form";
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
          <Link href="/admin/published" className={styles.backLink}>
            ← Назад к опубликованным
          </Link>
          <h1 className={styles.title}>Редактирование подписки</h1>
        </header>

        <EditSubscriptionForm
          item={{
            id: item.id,
            name: item.name,
            imgLink: item.imgLink,
            category: item.category,
            price: Number(item.price.toString()),
            period: item.period,
            moderationComment: item.moderationComment,
          }}
        />
      </div>
    </main>
  );
}
