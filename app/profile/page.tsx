import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { AppMenu } from "@/app/components/app-menu";
import { prisma } from "@/lib/prisma";

import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

type ProfileData = {
  name: string;
  email: string;
  initials: string;
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
      subscribes: true,
    },
  });

  if (!user) {
    return null;
  }

  const monthlyTotal = user.subscribes.reduce((sum, item) => {
    const price = Number(item.price.toString());
    const period = Math.max(item.period, 1);
    return sum + price / period;
  }, 0);

  return {
    name: user.name,
    email: user.email,
    initials: getInitials(user.name),
    yearlyTotal: Math.round(monthlyTotal * 12),
    activeSubscriptions: user.subscribes.length,
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

const HelpIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M9.5 9.2a2.7 2.7 0 0 1 5 1.1c0 1.8-2.2 2-2.2 3.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.8" r="1" fill="currentColor" />
  </svg>
);

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const profileData = await getProfileData(userId);
  if (!profileData) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <h1 className={styles.title}>Р СџРЎР‚Р С•РЎвЂћР С‘Р В»РЎРЉ</h1>
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
            <div className={styles.avatar}>{profileData.initials}</div>
            <div className={styles.userText}>
              <h2 className={styles.userName}>{profileData.name}</h2>
              <p className={styles.userEmail}>{profileData.email}</p>
            </div>
          </div>

          <div className={styles.statsRow}>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Р вЂ”Р В° Р С–Р С•Р Т‘</p>
              <p className={styles.statValue}>{formatRub(profileData.yearlyTotal)}РІвЂљР…</p>
            </article>
            <article className={styles.statCard}>
              <p className={styles.statLabel}>Р С’Р С”РЎвЂљР С‘Р Р†Р Р…Р С•</p>
              <p className={styles.statValue}>{profileData.activeSubscriptions} РЎв‚¬РЎвЂљРЎС“Р С”</p>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Р В¤Р С‘Р Р…Р В°Р Р…РЎРѓРЎвЂ№</h3>
          <div className={styles.group}>
            <button className={styles.row} type="button" disabled>
              <span className={`${styles.rowIcon} ${styles.financeColor}`}>
                <ClockIcon />
              </span>
              <span className={styles.rowText}>Р С’Р Р…Р В°Р В»Р С‘РЎвЂљР С‘Р С”Р В° РЎР‚Р В°РЎРѓРЎвЂ¦Р С•Р Т‘Р С•Р Р†</span>
              <Chevron />
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Р вЂР ВµР В·Р С•Р С—Р В°РЎРѓР Р…Р С•РЎРѓРЎвЂљРЎРЉ</h3>
          <div className={styles.group}>
            <button className={styles.row} type="button" disabled>
              <span className={`${styles.rowIcon} ${styles.securityColor}`}>
                <ShieldIcon />
              </span>
              <span className={styles.rowText}>Р С™Р С•Р Р…РЎвЂћР С‘Р Т‘Р ВµР Р…РЎвЂ Р С‘Р В°Р В»РЎРЉР Р…Р С•РЎРѓРЎвЂљРЎРЉ</span>
              <Chevron />
            </button>

            <button className={styles.row} type="button" disabled>
              <span className={`${styles.rowIcon} ${styles.supportColor}`}>
                <HelpIcon />
              </span>
              <span className={styles.rowText}>Р РЋР В»РЎС“Р В¶Р В±Р В° Р С—Р С•Р Т‘Р Т‘Р ВµРЎР‚Р В¶Р С”Р С‘</span>
              <Chevron />
            </button>
          </div>
        </section>

        <form action={logoutAction} className={styles.logoutWrap}>
          <button className={styles.logoutButton} type="submit">
            Р вЂ™РЎвЂ№Р в„–РЎвЂљР С‘ Р С‘Р В· Р В°Р С”Р С”Р В°РЎС“Р Р…РЎвЂљР В°
          </button>
        </form>
      </div>

      <AppMenu />
    </main>
  );
}
