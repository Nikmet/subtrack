"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type RegisterState } from "@/app/register/actions";
import styles from "./register-form.module.css";

const initialState: RegisterState = {
    error: null
};

export function RegisterForm() {
    const [state, formAction, isPending] = useActionState(registerAction, initialState);

    return (
        <form action={formAction} className={styles.form}>
            <label className={styles.label} htmlFor="name">
                Имя
            </label>
            <input className={styles.input} id="name" name="name" type="text" autoComplete="name" required />

            <label className={styles.label} htmlFor="email">
                Email
            </label>
            <input className={styles.input} id="email" name="email" type="email" autoComplete="email" required />

            <label className={styles.label} htmlFor="password">
                Пароль
            </label>
            <input
                className={styles.input}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
            />

            {state.error ? (
                <p className={styles.errorText} role="alert">
                    {state.error}
                </p>
            ) : null}

            <button className={styles.submitButton} disabled={isPending} type="submit">
                {isPending ? "Регистрация..." : "Создать аккаунт"}
            </button>

            <p className={styles.linkRow}>
                Уже есть аккаунт?{" "}
                <Link className={styles.link} href="/login">
                    Войти
                </Link>
            </p>
        </form>
    );
}
