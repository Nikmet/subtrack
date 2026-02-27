"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";
import { formatPaymentMethodLabel } from "@/app/utils/payment-method-formatters";
import { formatPeriodLabel } from "@/app/utils/subscription-formatters";

import { createUserSubscriptionAction } from "./actions";
import type { SearchCategory, SearchSubscriptionItem } from "./data";
import styles from "./search.module.css";

type SearchPaymentMethod = {
  id: string;
  bankId: string;
  cardNumber: string;
  isDefault: boolean;
  bank: {
    name: string;
    iconLink: string;
  };
};

type SearchBank = {
  id: string;
  name: string;
  iconLink: string;
};

type SearchClientProps = {
  q: string;
  category: string;
  hasFilters: boolean;
  categories: SearchCategory[];
  matchedTypes: SearchSubscriptionItem[];
  popularTypes: SearchSubscriptionItem[];
  attachType: SearchSubscriptionItem | null;
  paymentMethods: SearchPaymentMethod[];
  banks: SearchBank[];
};

const NEW_PAYMENT_METHOD_VALUE = "__new__";

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
  paymentMethods,
  banks,
}: SearchClientProps) {
  const defaultPaymentMethodId = useMemo(() => {
    if (paymentMethods.length === 0) {
      return NEW_PAYMENT_METHOD_VALUE;
    }

    return paymentMethods.find((item) => item.isDefault)?.id ?? paymentMethods[0]?.id ?? NEW_PAYMENT_METHOD_VALUE;
  }, [paymentMethods]);

  const [selectedItem, setSelectedItem] = useState<SearchSubscriptionItem | null>(attachType);
  const [nextPaymentAt, setNextPaymentAt] = useState(
    attachType ? getDefaultNextPaymentDate(attachType.period) : "",
  );
  const [paymentMethodId, setPaymentMethodId] = useState(defaultPaymentMethodId);
  const [newPaymentMethodBankId, setNewPaymentMethodBankId] = useState(banks[0]?.id ?? "");
  const [newPaymentMethodCardNumber, setNewPaymentMethodCardNumber] = useState("");

  const openModal = (item: SearchSubscriptionItem) => {
    setSelectedItem(item);
    setNextPaymentAt(getDefaultNextPaymentDate(item.period));
    setPaymentMethodId(defaultPaymentMethodId);
    setNewPaymentMethodBankId(banks[0]?.id ?? "");
    setNewPaymentMethodCardNumber("");
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

  const showNewPaymentMethodForm = paymentMethodId === NEW_PAYMENT_METHOD_VALUE;

  return (
    <>
      <h1 className={styles.title}>Поиск</h1>

      <form className={styles.searchForm} action="/search/all" method="GET">
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
              href={`/search/all?${new URLSearchParams({
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
            <Link href="/search/all" className={styles.sectionLink}>
              Все результаты
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
                    <p className={styles.itemCategory}>{item.categoryName} • {formatPeriodLabel(item.period)}</p>
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
          <Link href="/search/all" className={styles.sectionLink}>
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
                <p className={styles.itemCategory}>{item.categoryName} • {formatPeriodLabel(item.period)}</p>
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
                  {selectedItem.categoryName} • {formatRub(selectedItem.price)} • {formatPeriodLabel(selectedItem.period)}
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
                <label className={styles.label} htmlFor="paymentMethodId">
                  Способ оплаты
                </label>
                <select
                  id="paymentMethodId"
                  className={styles.input}
                  name="paymentMethodId"
                  value={paymentMethodId}
                  onChange={(event) => setPaymentMethodId(event.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {formatPaymentMethodLabel(method.bank.name, method.cardNumber)}{method.isDefault ? " (по умолчанию)" : ""}
                    </option>
                  ))}
                  <option value={NEW_PAYMENT_METHOD_VALUE}>Новая карта</option>
                </select>
              </div>

              {showNewPaymentMethodForm ? (
                <>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="newPaymentMethodBankId">
                      Банк
                    </label>
                    <select
                      id="newPaymentMethodBankId"
                      className={styles.input}
                      name="newPaymentMethodBankId"
                      value={newPaymentMethodBankId}
                      onChange={(event) => setNewPaymentMethodBankId(event.target.value)}
                      required
                    >
                      {banks.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label} htmlFor="newPaymentMethodCardNumber">
                      Номер карты
                    </label>
                    <input
                      id="newPaymentMethodCardNumber"
                      className={styles.input}
                      type="text"
                      name="newPaymentMethodCardNumber"
                      placeholder="Например, **** 4242"
                      value={newPaymentMethodCardNumber}
                      onChange={(event) => setNewPaymentMethodCardNumber(event.target.value)}
                      minLength={4}
                      maxLength={24}
                      required
                    />
                  </div>
                </>
              ) : null}

              <SubmitButton />
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
