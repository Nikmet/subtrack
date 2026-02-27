import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { getCatalogPage, getCategories, getTypeById } from "../data";
import { SearchAllClient } from "./search-all-client";
import styles from "../search.module.css";

export const dynamic = "force-dynamic";

type SearchAllPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    attach?: string;
  }>;
};

const parsePage = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.trunc(parsed);
};

export default async function SearchAllPage({ searchParams }: SearchAllPageProps) {
  const user = await getAuthorizedUser();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const page = parsePage((params.page ?? "").trim());
  const attach = (params.attach ?? "").trim();

  const [categories, catalogPage, attachType, paymentMethods, banks] = await Promise.all([
    getCategories(),
    getCatalogPage({ q, category, page, pageSize: 24 }),
    attach ? getTypeById(attach, user.role === "ADMIN") : Promise.resolve(null),
    prisma.paymentMethod.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        bankId: true,
        cardNumber: true,
        isDefault: true,
        bank: {
          select: {
            name: true,
            iconLink: true,
          },
        },
      },
    }),
    prisma.bank.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        iconLink: true,
      },
    }),
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.sectionHead}>
          <h1 className={styles.title}>Каталог подписок</h1>
          <Link href="/search" className={styles.sectionLink}>
            Назад
          </Link>
        </div>

        <SearchAllClient
          q={q}
          category={category}
          categories={categories}
          catalogPage={catalogPage}
          attachType={attachType}
          paymentMethods={paymentMethods}
          banks={banks}
        />
      </div>

      <AppMenu />
    </main>
  );
}
