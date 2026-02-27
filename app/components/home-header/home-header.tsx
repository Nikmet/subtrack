import Link from "next/link";

import { UserAvatar } from "@/app/components/user-avatar/user-avatar";
import styles from "./home-header.module.css";
import { BellIcon } from "lucide-react";

type HomeHeaderProps = {
    userInitials: string;
    userAvatarLink: string | null;
};

export function HomeHeader({ userInitials, userAvatarLink }: HomeHeaderProps) {
    return (
        <header className={styles.topBar}>
            <div className={styles.headerBlock}>
                <h1 className={styles.pageTitle}>Домашняя</h1>
                <p className={styles.pageSubtitle}>Ваши подписки и платежи</p>
            </div>

            <div className={styles.topActions}>
                <Link href="/notifications" className={styles.notifyButton} aria-label="Открыть уведомления">
                    <BellIcon />
                </Link>
                <Link href="/profile" className={styles.avatarLink} aria-label="Профиль">
                    <UserAvatar
                        src={userAvatarLink}
                        name="Профиль"
                        wrapperClassName={styles.avatarWrap}
                        imageClassName={styles.avatarImage}
                        fallbackClassName={styles.avatar}
                        fallbackText={userInitials || "?"}
                    />
                </Link>
            </div>
        </header>
    );
}
