import Link from "next/link";

import { SubmitButton } from "@/app/components/forms/submit-button";
import { requireAdminUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { createBankAction, deleteBankAction, updateBankAction } from "./actions";
import { BankForm } from "./bank-form";
import styles from "../admin.module.css";

export const dynamic = "force-dynamic";

export default async function BanksPage() {
  await requireAdminUser();

  const banks = await prisma.bank.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      iconLink: true,
      _count: {
        select: {
          paymentMethods: true,
        },
      },
    },
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/admin" className={styles.backLink}>
            ← В админ-панель
          </Link>
          <h1 className={styles.title}>Банки</h1>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Новый банк</h2>
          <BankForm
            action={createBankAction}
            formClassName={styles.filtersPanel}
            submitClassName={styles.publishButton}
            submitIdleLabel="Добавить банк"
            submitPendingLabel="Сохраняем..."
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Справочник</h2>
          {banks.length === 0 ? (
            <p className={styles.emptyText}>Банки пока не добавлены.</p>
          ) : (
            <div className={styles.grid}>
              {banks.map((bank) => (
                <article key={bank.id} className={styles.card}>
                  <div className={styles.cardTopRow}>
                    <div className={styles.cardIconWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bank.iconLink} alt={bank.name} className={styles.cardIconImage} />
                    </div>
                    <p className={styles.cardTitle}>{bank.name}</p>
                  </div>
                  <p className={styles.cardSubMeta}>Используется в {bank._count.paymentMethods} способах оплаты</p>

                  <BankForm
                    action={updateBankAction}
                    formClassName={styles.inlineForm}
                    submitClassName={styles.editLink}
                    submitIdleLabel="Обновить"
                    submitPendingLabel="Сохраняем..."
                    bankId={bank.id}
                    initialName={bank.name}
                    initialIconLink={bank.iconLink}
                  />

                  <form action={deleteBankAction}>
                    <input type="hidden" name="bankId" value={bank.id} />
                    <SubmitButton className={styles.deleteButton} idleLabel="Удалить" pendingLabel="Удаляем..." />
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
