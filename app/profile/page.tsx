import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { AppMenu } from "@/app/components/app-menu/app-menu";
import { UserAvatar } from "@/app/components/user-avatar/user-avatar";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

type ProfileData = {
  name: string;
  email: string;
  initials: string;
  avatarLink: string | null;
  yearlyTotal: number;
  activeSubscriptions: number;
};

const formatRub = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value);

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

async function getProfileData(userId: string): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        include: {
          commonSubscription: {
            select: {
              price: true,
              period: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const monthlyTotal = user.subscriptions.reduce((sum, item) => {
    const price = Number(item.commonSubscription.price.toString());
    const period = Math.max(item.commonSubscription.period, 1);
    return sum + price / period;
  }, 0);

  return {
    name: user.name,
    email: user.email,
    initials: getInitials(user.name),
    avatarLink: user.avatarLink,
    yearlyTotal: Math.round(monthlyTotal * 12),
    activeSubscriptions: user.subscriptions.length,
  };
}

async function logoutAction() {
  "use server";

  await signOut({ redirectTo: "/login" });
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" className={styles.chevron} aria-hidden>
    <path
      d="m9 6 6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <path
      d="M12 3 5.5 6v5.5c0 4.2 2.7 7.3 6.5 9 3.8-1.7 6.5-4.8 6.5-9V6z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export default async function ProfilePage() {
  const user = await getAuthorizedUser();

  const profileData = await getProfileData(user.id);
  if (!profileData) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <h1 className={styles.title}>Профиль</h1>
            <Link className={styles.settingsButton} href="/settings" aria-label="Настройки">
              <svg viewBox="0 0 24 24" className={styles.settingsIcon}>
                <path
                  d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m19 12 1.9-1.1-1.1-2-2.2.2a6.5 6.5 0 0 0-1.2-1.2l.2-2.2-2-1.1L13.5 6a6.5 6.5 0 0 0-3 0L9.4 4.6l-2 1.1.2 2.2a6.5 6.5 0 0 0-1.2 1.2l-2.2-.2-1.1 2L5 12a6.4 6.4 0 0 0 0 3l-1.9 1.1 1.1 2 2.2-.2a6.5 6.5 0 0 0 1.2 1.2l-.2 2.2 2 1.1 1.1-1.9a6.5 6.5 0 0 0 3 0l1.1 1.9 2-1.1-.2-2.2a6.5 6.5 0 0 0 1.2-1.2l2.2.2 1.1-2L19 15a6.4 6.4 0 0 0 0-3Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className={styles.userRow}>
            <UserAvatar
              src={profileData.avatarLink}
              name={profileData.name}
              wrapperClassName={styles.avatarWrap}
              imageClassName={styles.avatarImage}
              fallbackClassName={styles.avatar}
              fallbackText={profileData.initials}
            />
            <div className={styles.userText}>
              <h2 className={styles.userName}>{profileData.name}</h2>
              <p className={styles.userEmail}>{profileData.email}</p>
            </div>
          </div>

          <div className={styles.statsRow}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>За год</p>
              <p className={styles.statValue}>{formatRub(profileData.yearlyTotal)} ₽</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Активные подписки</p>
              <p className={styles.statValue}>{profileData.activeSubscriptions}</p>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Подписки</h3>
          <div className={styles.group}>
            <Link className={styles.row} href="/subscriptions/pending">
              <span className={`${styles.rowIcon} ${styles.financeColor}`}>
                <ClockIcon />
              </span>
              <span className={styles.rowText}>Мои заявки на публикацию</span>
              <Chevron />
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Безопасность</h3>
          <div className={styles.group}>
            <button className={styles.row} type="button" disabled>
              <span className={`${styles.rowIcon} ${styles.securityColor}`}>
                <ShieldIcon />
              </span>
              <span className={styles.rowText}>Двухфакторная аутентификация</span>
              <Chevron />
            </button>
          </div>
        </section>

        <form action={logoutAction} className={styles.logoutWrap}>
          <button className={styles.logoutButton} type="submit">
            Выйти из аккаунта
          </button>
        </form>
      </div>

      <AppMenu />
    </main>
  );
}
