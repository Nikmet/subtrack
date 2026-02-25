"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";

import { createUserSubscriptionAction } from "./actions";
import type { SearchCategory, SearchSubscriptionItem } from "./data";
import styles from "./search.module.css";

type SearchClientProps = {
  q: string;
  category: string;
  hasFilters: boolean;
  categories: SearchCategory[];
  matchedTypes: SearchSubscriptionItem[];
  popularTypes: SearchSubscriptionItem[];
  attachType: SearchSubscriptionItem | null;
};

const formatRub = (value: number | null) =>
  value === null
    ? "-"
    : `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

const toDateValue = (date: Date) => {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const addMonthsClamped = (date: Date, months: number) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const targetFirst = new Date(year, month + months, 1, 12, 0, 0, 0);
  const lastDay = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0, 12, 0, 0, 0).getDate();

  return new Date(targetFirst.getFullYear(), targetFirst.getMonth(), Math.min(day, lastDay), 12, 0, 0, 0);
};

const getDefaultNextPaymentDate = (period: number) => {
  const baseDate = new Date();
  const safePeriod = Math.max(period, 1);
  return toDateValue(addMonthsClamped(baseDate, safePeriod));
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={styles.modalSubmitButton} disabled={pending}>
      {pending ? "Сохраняем..." : "Добавить подписку"}
    </button>
  );
}

export function SearchClient({
  q,
  category,
  hasFilters,
  categories,
  matchedTypes,
  popularTypes,
  attachType,
}: SearchClientProps) {
  const [selectedItem, setSelectedItem] = useState<SearchSubscriptionItem | null>(attachType);
  const [nextPaymentAt, setNextPaymentAt] = useState(
    attachType ? getDefaultNextPaymentDate(attachType.period) : "",
  );
  const [paymentCardLabel, setPaymentCardLabel] = useState("");

  const openModal = (item: SearchSubscriptionItem) => {
    setSelectedItem(item);
    setNextPaymentAt(getDefaultNextPaymentDate(item.period));
    setPaymentCardLabel("");
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem]);

  return (
    <>
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
              className={`${styles.categoryCard} ${category === item.slug ? styles.categoryCardActive : ""}`}
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
                  <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => openModal(item)}
                    aria-label={`Добавить ${item.name}`}
                  >
                    +
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                По вашему запросу ничего не найдено. Попробуйте создать подписку вручную.
              </p>
              <Link href="/subscriptions/new" className={styles.emptyAction}>
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
              <button
                type="button"
                className={styles.addButton}
                onClick={() => openModal(item)}
                aria-label={`Добавить ${item.name}`}
              >
                +
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ctaCard}>
        <h3 className={styles.ctaTitle}>Не нашли сервис?</h3>
        <p className={styles.ctaText}>Добавьте свою подписку вручную со своими условиями и иконкой.</p>
        <Link href="/subscriptions/new" className={styles.ctaButton}>
          Создать вручную
        </Link>
      </section>

      {selectedItem ? (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label={`Добавить ${selectedItem.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h3 className={styles.modalTitle}>Добавить подписку</h3>
              <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Закрыть">
                ×
              </button>
            </div>

            <div className={styles.modalServiceInfo}>
              <SubscriptionIcon
                src={selectedItem.imgLink}
                name={selectedItem.name}
                wrapperClassName={styles.modalIconWrap}
                imageClassName={styles.modalIconImage}
                fallbackClassName={styles.modalIconFallback}
              />
              <div className={styles.modalServiceText}>
                <p className={styles.modalServiceName}>{selectedItem.name}</p>
                <p className={styles.modalServiceMeta}>
                  {selectedItem.categoryName} • {formatRub(selectedItem.price)} / {selectedItem.period} мес.
                </p>
              </div>
            </div>

            <form action={createUserSubscriptionAction} className={styles.modalForm}>
              <input type="hidden" name="commonSubscriptionId" value={selectedItem.id} />

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="nextPaymentAt">
                  Дата списания
                </label>
                <input
                  id="nextPaymentAt"
                  className={styles.input}
                  type="date"
                  name="nextPaymentAt"
                  value={nextPaymentAt}
                  onChange={(event) => setNextPaymentAt(event.target.value)}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="paymentCardLabel">
                  Карта списания
                </label>
                <input
                  id="paymentCardLabel"
                  className={styles.input}
                  type="text"
                  name="paymentCardLabel"
                  placeholder="Напр. Visa **** 4242"
                  value={paymentCardLabel}
                  onChange={(event) => setPaymentCardLabel(event.target.value)}
                  required
                />
              </div>

              <SubmitButton />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
