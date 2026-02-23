import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppMenu } from "@/app/components/app-menu/app-menu";
import { NewSubscriptionForm } from "@/app/components/subscriptions/new-subscription-form";

import styles from "./new-subscription.module.css";

export const dynamic = "force-dynamic";

export default async function NewSubscriptionPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
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

        <NewSubscriptionForm />
      </div>

      <AppMenu />
    </main>
  );
}
