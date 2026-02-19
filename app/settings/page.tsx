import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth, signOut } from "@/auth";
import { AppMenu } from "@/app/components/app-menu";
import { prisma } from "@/lib/prisma";

import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

type SettingsData = {
  name: string;
  email: string;
  initials: string;
  paymentMethodLabel: string;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

async function getSettingsData(userId: string): Promise<SettingsData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscribes: {
        where: {
          paymentMethodLabel: {
            not: null,
          },
        },
        orderBy: {
          id: "asc",
        },
        take: 1,
        select: {
          paymentMethodLabel: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    name: user.name,
    email: user.email,
    initials: getInitials(user.name),
    paymentMethodLabel: user.subscribes[0]?.paymentMethodLabel ?? "Не указан",
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

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M6.5 18a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <rect x="3.5" y="6" width="17" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M3.5 10h17" stroke="currentColor" strokeWidth="2" />
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

const BellIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <path
      d="M12 4a5 5 0 0 0-5 5v2.8c0 .5-.2 1-.5 1.4L5 15h14l-1.5-1.8a2 2 0 0 1-.5-1.4V9a5 5 0 0 0-5-5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M3.8 12h16.4M12 3.5c2.2 2.5 3.3 5.4 3.3 8.5S14.2 18 12 20.5C9.8 18 8.7 15.1 8.7 12S9.8 6 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <path
      d="M14.2 4.2a7.5 7.5 0 1 0 5.6 12.5A8 8 0 0 1 14.2 4.2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <rect x="7.5" y="4" width="9" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
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

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.rowIconSvg} aria-hidden>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 10.5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7.5" r="1" fill="currentColor" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.cameraIcon} aria-hidden>
    <path
      d="M7 8.5h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Zm3-2h4l1 2h-6l1-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="13.5" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

type SettingsRowProps = {
  href?: string;
  title: string;
  subtitle?: string;
  value?: string;
  icon: ReactNode;
};

function SettingsRow({ href, title, subtitle, value, icon }: SettingsRowProps) {
  const content = (
    <>
      <span className={styles.rowIconWrap}>{icon}</span>
      <span className={styles.rowMain}>
        <span className={styles.rowTitle}>{title}</span>
        {subtitle ? <span className={styles.rowSubtitle}>{subtitle}</span> : null}
      </span>
      <span className={styles.rowRight}>
        {value ? <span className={styles.rowValue}>{value}</span> : null}
        <Chevron />
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.row}>
        {content}
      </Link>
    );
  }

  return (
    <button className={styles.row} type="button" disabled>
      {content}
    </button>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const settingsData = await getSettingsData(userId);
  if (!settingsData) {
    redirect("/login");
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/profile" className={styles.backButton} aria-label="Назад">
            ‹
          </Link>
          <h1 className={styles.title}>Настройки</h1>
          <span className={styles.headerSpacer} />
        </header>

        <section className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{settingsData.initials}</div>
            <button className={styles.cameraButton} type="button" disabled aria-label="Изменить фото">
              <CameraIcon />
            </button>
          </div>

          <h2 className={styles.name}>{settingsData.name}</h2>
          <p className={styles.email}>{settingsData.email}</p>
          <p className={styles.planBadge}>FREE План</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Учетная запись</h3>
          <div className={styles.group}>
            <SettingsRow icon={<UserIcon />} title="Личные данные" />
            <SettingsRow
              icon={<CardIcon />}
              title="Способы оплаты"
              subtitle={settingsData.paymentMethodLabel}
              value={settingsData.paymentMethodLabel}
            />
            <SettingsRow icon={<ShieldIcon />} title="Безопасность" />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Предпочтения</h3>
          <div className={styles.group}>
            <SettingsRow
              href="/notifications"
              icon={<BellIcon />}
              title="Уведомления"
              subtitle="Вкл"
              value="Вкл"
            />
            <SettingsRow
              icon={<GlobeIcon />}
              title="Язык и валюта"
              subtitle="RU / ₽"
              value="RU / ₽"
            />
            <SettingsRow icon={<MoonIcon />} title="Темная тема" subtitle="Авто" value="Авто" />
            <SettingsRow icon={<PhoneIcon />} title="Виджеты" />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Поддержка</h3>
          <div className={styles.group}>
            <SettingsRow icon={<HelpIcon />} title="Центр помощи" />
            <SettingsRow icon={<InfoIcon />} title="О приложении" subtitle="v1.4.2" value="v1.4.2" />
          </div>
        </section>

        <form action={logoutAction} className={styles.logoutForm}>
          <button className={styles.logoutButton} type="submit">
            <span className={styles.logoutIcon}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M9 7V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 12H4m0 0 3-3m-3 3 3 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Выйти из аккаунта</span>
            <Chevron />
          </button>
        </form>

        <footer className={styles.footer}>
          <p>SubTrack App © 2026</p>
          <p>Сделано с любовью для контроля финансов</p>
        </footer>
      </div>

      <AppMenu />
    </main>
  );
}
