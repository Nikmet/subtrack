import { AppMenu } from "@/app/components/app-menu/app-menu";
import { getAuthorizedUser } from "@/lib/auth-guards";

import { getCategories, getPopularTypes, getTypeById, searchTypes } from "./data";
import { SearchClient } from "./search-client";
import styles from "./search.module.css";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    attach?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await getAuthorizedUser();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const attach = (params.attach ?? "").trim();
  const hasFilters = q.length > 0 || category.length > 0;

  const [categories, popularTypes, attachType] = await Promise.all([
    getCategories(),
    getPopularTypes(8),
    attach ? getTypeById(attach, user.role === "ADMIN") : Promise.resolve(null),
  ]);
  const matchedTypes = hasFilters ? await searchTypes(q, category || undefined) : [];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <SearchClient
          q={q}
          category={category}
          hasFilters={hasFilters}
          categories={categories}
          matchedTypes={matchedTypes}
          popularTypes={popularTypes}
          attachType={attachType}
        />
      </div>

      <AppMenu />
    </main>
  );
}
