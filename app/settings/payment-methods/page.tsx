import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { SubmitButton } from "@/app/components/forms/submit-button";
import { PaymentMethodsToastTrigger } from "@/app/components/toast/payment-methods-toast-trigger";
import { formatPaymentMethodLabel } from "@/app/utils/payment-method-formatters";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import {
  createPaymentMethodAction,
  deletePaymentMethodAction,
  renamePaymentMethodAction,
  setDefaultPaymentMethodAction,
} from "./actions";
import styles from "./payment-methods.module.css";

export const dynamic = "force-dynamic";

type PaymentMethodsPageProps = {
  searchParams: Promise<{
    toast?: string;
    name?: string;
  }>;
};

export default async function PaymentMethodsPage({ searchParams }: PaymentMethodsPageProps) {
  const user = await getAuthorizedUser();
  const params = await searchParams;

  const [banks, paymentMethods] = await Promise.all([
    prisma.bank.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        iconLink: true,
      },
    }),
    prisma.paymentMethod.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        cardNumber: true,
        bankId: true,
        isDefault: true,
        bank: {
          select: {
            name: true,
            iconLink: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    }),
  ]);

  const hasBanks = banks.length > 0;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <PaymentMethodsToastTrigger toastType={params.toast} name={params.name} />

        <header className={styles.header}>
          <Link href="/settings" className={styles.backButton} aria-label="Назад в настройки">
            ‹
          </Link>
          <h1 className={styles.title}>Способы оплаты</h1>
          <span className={styles.spacer} />
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Новый способ оплаты</h2>
          {hasBanks ? (
            <form action={createPaymentMethodAction} className={styles.createForm}>
              <select name="bankId" className={styles.input} defaultValue={banks[0]?.id} required>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
              <input
                name="cardNumber"
                className={styles.input}
                type="text"
                placeholder="Номер карты, например **** 4242"
                minLength={4}
                maxLength={24}
                required
              />
              <SubmitButton className={styles.primaryButton} idleLabel="Добавить" pendingLabel="Добавляем..." />
            </form>
          ) : (
            <p className={styles.emptyText}>Банки не настроены. Добавьте их в админ-панели.</p>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Ваши способы</h2>
          {paymentMethods.length === 0 ? (
            <p className={styles.emptyText}>Добавьте первый способ оплаты.</p>
          ) : (
            <div className={styles.methodsList}>
              {paymentMethods.map((method) => (
                <article key={method.id} className={styles.methodCard}>
                  <div className={styles.methodHead}>
                    <div className={styles.bankSummary}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={method.bank.iconLink} alt={method.bank.name} className={styles.bankIcon} />
                      <p className={styles.methodLabel}>{formatPaymentMethodLabel(method.bank.name, method.cardNumber)}</p>
                    </div>
                    {method.isDefault ? <span className={styles.defaultBadge}>По умолчанию</span> : null}
                  </div>
                  <p className={styles.methodMeta}>Подписок: {method._count.subscriptions}</p>

                  {hasBanks ? (
                    <form action={renamePaymentMethodAction} className={styles.inlineForm}>
                      <input type="hidden" name="paymentMethodId" value={method.id} />
                      <select name="bankId" className={styles.input} defaultValue={method.bankId} required>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.id}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                      <input
                        name="cardNumber"
                        className={styles.input}
                        type="text"
                        defaultValue={method.cardNumber}
                        minLength={4}
                        maxLength={24}
                        required
                      />
                      <SubmitButton className={styles.secondaryButton} idleLabel="Обновить" pendingLabel="Сохраняем..." />
                    </form>
                  ) : null}

                  <div className={styles.actionsRow}>
                    {!method.isDefault ? (
                      <form action={setDefaultPaymentMethodAction}>
                        <input type="hidden" name="paymentMethodId" value={method.id} />
                        <SubmitButton className={styles.secondaryButton} idleLabel="Сделать основным" pendingLabel="Сохраняем..." />
                      </form>
                    ) : null}

                    <form action={deletePaymentMethodAction}>
                      <input type="hidden" name="paymentMethodId" value={method.id} />
                      <SubmitButton className={styles.deleteButton} idleLabel="Удалить" pendingLabel="Удаляем..." />
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AppMenu />
    </main>
  );
}
