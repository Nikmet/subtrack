import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/app/components/auth/login-form";

import styles from "./login.module.css";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.overline}>SubTrack</p>
        <h1 className={styles.title}>Вход в аккаунт</h1>
        <p className={styles.subtitle}>
          Используйте email и пароль или создайте новый аккаунт.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}
