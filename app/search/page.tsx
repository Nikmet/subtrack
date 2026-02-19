import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppMenu } from "@/app/components/app-menu";
import { SubscriptionIcon } from "@/app/components/subscription-icon";

import { getCategories, getPopularTypes, searchTypes } from "./data";
import styles from "./search.module.css";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

const formatRub = (value: number | null) =>
  value === null
    ? "-"
    : `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
        Math.round(value),
      )}₽`;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();

  const [categories, popularTypes, matchedTypes] = await Promise.all([
    getCategories(),
    getPopularTypes(8),
    searchTypes(q, category || undefined),
  ]);

  const hasFilters = q.length > 0 || category.length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Поиск</h1>

        <form className={styles.searchForm} action="/search" method="GET">
          <input
            className={styles.searchInput}
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Найти подписку или сервис..."
          />
          {category ? <input type="hidden" name="category" value={category} /> : null}
        </form>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Категории</h2>
          <div className={styles.categoryGrid}>
            {categories.map((item) => (
              <Link
                key={item.id}
                href={`/search?${new URLSearchParams({
                  ...(q ? { q } : {}),
                  category: item.slug,
                }).toString()}`}
                className={`${styles.categoryCard} ${
                  category === item.slug ? styles.categoryCardActive : ""
                }`}
              >
                <span className={styles.categoryName}>{item.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {hasFilters ? (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Результаты</h2>
              <Link href="/search" className={styles.sectionLink}>
                Сбросить
              </Link>
            </div>

            {matchedTypes.length > 0 ? (
              <div className={styles.list}>
                {matchedTypes.map((item) => (
                  <article key={item.id} className={styles.itemCard}>
                    <SubscriptionIcon
                      src={item.imgLink}
                      name={item.name}
                      wrapperClassName={styles.itemIconWrap}
                      imageClassName={styles.itemIconImage}
                      fallbackClassName={styles.itemIconFallback}
                    />
                    <div className={styles.itemMain}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemCategory}>{item.categoryName}</p>
                    </div>
                    <div className={styles.itemPriceWrap}>
                      <p className={styles.itemPrice}>{formatRub(item.suggestedMonthlyPrice)}</p>
                      <p className={styles.itemPriceLabel}>/мес</p>
                    </div>
                    <Link
                      href={`/subscriptions/new?typeId=${item.id}`}
                      className={styles.addButton}
                      aria-label={`Добавить ${item.name}`}
                    >
                      +
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>
                  По вашему запросу ничего не найдено. Попробуйте создать подписку вручную.
                </p>
                <Link href="/subscriptions/new?custom=1" className={styles.emptyAction}>
                  Создать вручную
                </Link>
              </div>
            )}
          </section>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Популярные</h2>
            <Link href="/search" className={styles.sectionLink}>
              Все
            </Link>
          </div>

          <div className={styles.list}>
            {popularTypes.map((item) => (
              <article key={item.id} className={styles.itemCard}>
                <SubscriptionIcon
                  src={item.imgLink}
                  name={item.name}
                  wrapperClassName={styles.itemIconWrap}
                  imageClassName={styles.itemIconImage}
                  fallbackClassName={styles.itemIconFallback}
                />
                <div className={styles.itemMain}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemCategory}>{item.categoryName}</p>
                </div>
                <div className={styles.itemPriceWrap}>
                  <p className={styles.itemPrice}>{formatRub(item.suggestedMonthlyPrice)}</p>
                  <p className={styles.itemPriceLabel}>/мес</p>
                </div>
                <Link
                  href={`/subscriptions/new?typeId=${item.id}`}
                  className={styles.addButton}
                  aria-label={`Добавить ${item.name}`}
                >
                  +
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaCard}>
          <h3 className={styles.ctaTitle}>Не нашли сервис?</h3>
          <p className={styles.ctaText}>
            Добавьте свою подписку вручную со своими условиями и иконкой.
          </p>
          <Link href="/subscriptions/new?custom=1" className={styles.ctaButton}>
            Создать вручную
          </Link>
        </section>
      </div>

      <AppMenu />
    </main>
  );
}
