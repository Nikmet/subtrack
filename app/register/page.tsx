import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { RegisterForm } from "@/app/components/auth/register-form";

import styles from "./register.module.css";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.overline}>SubTrack</p>
        <h1 className={styles.title}>Регистрация</h1>
        <p className={styles.subtitle}>Создайте аккаунт, чтобы начать вести подписки.</p>

        <RegisterForm />
      </section>
    </main>
  );
}
