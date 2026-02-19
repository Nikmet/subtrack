import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppMenu } from "@/app/components/app-menu";
import { prisma } from "@/lib/prisma";

import { NewSubscriptionForm } from "./new-subscription-form";
import styles from "./new-subscription.module.css";

export const dynamic = "force-dynamic";

type NewSubscriptionPageProps = {
  searchParams: Promise<{
    typeId?: string;
    custom?: string;
  }>;
};

export default async function NewSubscriptionPage({
  searchParams,
}: NewSubscriptionPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const typeId = (params.typeId ?? "").trim();
  const customFlag = params.custom === "1";
  const isCustom = customFlag || !typeId;

  const [categories, existingType] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    typeId
      ? prisma.type.findUnique({
          where: { id: typeId },
          select: {
            id: true,
            name: true,
            imgLink: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  if (typeId && !existingType && !isCustom) {
    redirect("/search");
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/search" className={styles.backButton} aria-label="Назад к поиску">
            ×
          </Link>
          <h1 className={styles.title}>Новая подписка</h1>
          <span className={styles.headerPlaceholder} />
        </header>

        <NewSubscriptionForm
          categories={categories}
          existingType={
            existingType
              ? {
                  id: existingType.id,
                  name: existingType.name,
                  categoryId: existingType.categoryId,
                  categoryName: existingType.category.name,
                  imgLink: existingType.imgLink,
                }
              : null
          }
          isCustom={isCustom}
        />
      </div>

      <AppMenu />
    </main>
  );
}

