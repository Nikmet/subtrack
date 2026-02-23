import Link from "next/link";

import styles from "./home-header.module.css";

type HomeHeaderProps = {
    userInitials: string;
};

export function HomeHeader({ userInitials }: HomeHeaderProps) {
    return (
        <header className={styles.topBar}>
            <div className={styles.headerBlock}>
                <h1 className={styles.pageTitle}>Домашняя</h1>
                <p className={styles.pageSubtitle}>Ваши подписки и платежи</p>
            </div>

            <div className={styles.topActions}>
                <Link href="/notifications" className={styles.notifyButton} aria-label="Открыть уведомления">
                    <svg viewBox="0 0 24 24" aria-hidden>
                        <path
                            d="M12 4a5 5 0 0 0-5 5v2.8c0 .5-.2 1-.5 1.4L5 15h14l-1.5-1.8a2 2 0 0 1-.5-1.4V9a5 5 0 0 0-5-5Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinejoin="round"
                        />
                        <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                </Link>
                <Link href="/profile" className={styles.avatarLink} aria-label="Профиль">
                    <span className={styles.avatar}>{userInitials || "?"}</span>
                </Link>
            </div>
        </header>
    );
}
