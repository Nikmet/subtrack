import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { NewSubscriptionForm } from "@/app/components/subscriptions/new-subscription-form";
import { getAuthorizedUser } from "@/lib/auth-guards";

import styles from "./new-subscription.module.css";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  await getAuthorizedUser();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/search" className={styles.backButton} aria-label="Назад к поиску">
            ×
          </Link>
          <h1 className={styles.title}>Новая общая подписка</h1>
          <span className={styles.headerPlaceholder} />
        </header>

        <NewSubscriptionForm />
      </div>

      <AppMenu />
    </main>
  );
}
