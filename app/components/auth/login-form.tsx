"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type LoginState } from "@/app/login/actions";
import styles from "./login-form.module.css";

const initialState: LoginState = {
    error: null
};

export function LoginForm() {
    const [state, formAction, isPending] = useActionState(loginAction, initialState);

    return (
        <form action={formAction} className={styles.form}>
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
                autoComplete="current-password"
                required
            />

            {state.error ? (
                <p className={styles.errorText} role="alert">
                    {state.error}
                </p>
            ) : null}

            <button className={styles.submitButton} disabled={isPending} type="submit">
                {isPending ? "Вход..." : "Войти"}
            </button>

            <p className={styles.linkRow}>
                Нет аккаунта?{" "}
                <Link className={styles.link} href="/register">
                    Зарегистрироваться
                </Link>
            </p>
        </form>
    );
}
