import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { SubmitButton } from "@/app/components/forms/submit-button";
import { SettingsSecurityToastTrigger } from "@/app/components/toast/settings-security-toast-trigger";
import { getAuthorizedUser } from "@/lib/auth-guards";

import { changePasswordAction } from "./actions";
import styles from "./security.module.css";

export const dynamic = "force-dynamic";

type SettingsSecurityPageProps = {
  searchParams: Promise<{
    toast?: string;
  }>;
};

export default async function SettingsSecurityPage({ searchParams }: SettingsSecurityPageProps) {
  await getAuthorizedUser();
  const params = await searchParams;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <SettingsSecurityToastTrigger toastType={params.toast} />

        <header className={styles.header}>
          <Link href="/settings" className={styles.backButton} aria-label="Назад в настройки">
            ‹
          </Link>
          <h1 className={styles.title}>Безопасность</h1>
          <span className={styles.spacer} />
        </header>

        <form action={changePasswordAction} className={styles.form}>
          <label className={styles.label} htmlFor="currentPassword">
            Текущий пароль
          </label>
          <input id="currentPassword" className={styles.input} name="currentPassword" type="password" required />

          <label className={styles.label} htmlFor="newPassword">
            Новый пароль
          </label>
          <input
            id="newPassword"
            className={styles.input}
            name="newPassword"
            type="password"
            minLength={8}
            required
          />

          <label className={styles.label} htmlFor="confirmPassword">
            Подтверждение нового пароля
          </label>
          <input
            id="confirmPassword"
            className={styles.input}
            name="confirmPassword"
            type="password"
            minLength={8}
            required
          />

          <SubmitButton className={styles.submitButton} idleLabel="Обновить пароль" pendingLabel="Сохраняем..." />
        </form>
      </div>

      <AppMenu />
    </main>
  );
}
