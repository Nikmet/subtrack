import Link from "next/link";
import { type ReactNode } from "react";

import { signOut } from "@/auth";
import { AppMenu } from "@/app/components/app-menu/app-menu";
import { UserAvatar } from "@/app/components/user-avatar/user-avatar";
import { formatPaymentMethodLabel } from "@/app/utils/payment-method-formatters";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

type SettingsData = {
  name: string;
  email: string;
  initials: string;
  avatarLink: string | null;
  defaultPaymentMethodLabel: string;
  role: "USER" | "ADMIN";
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
      paymentMethods: {
        where: {
          isDefault: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: 1,
        select: {
          cardNumber: true,
          bank: {
            select: {
              name: true,
            },
          },
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
    avatarLink: user.avatarLink,
    defaultPaymentMethodLabel: user.paymentMethods[0]
      ? formatPaymentMethodLabel(user.paymentMethods[0].bank.name, user.paymentMethods[0].cardNumber)
      : "Не указан",
    role: user.role,
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
  const user = await getAuthorizedUser();

  const settingsData = await getSettingsData(user.id);
  if (!settingsData) {
    return null;
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
            <UserAvatar
              src={settingsData.avatarLink}
              name={settingsData.name}
              wrapperClassName={styles.avatarWrap}
              imageClassName={styles.avatarImage}
              fallbackClassName={styles.avatar}
              fallbackText={settingsData.initials}
            />
          </div>

          <h2 className={styles.name}>{settingsData.name}</h2>
          <p className={styles.email}>{settingsData.email}</p>
          <p className={styles.planBadge}>FREE План</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Учетная запись</h3>
          <div className={styles.group}>
            <SettingsRow href="/settings/profile" icon={<UserIcon />} title="Личные данные" />
            <SettingsRow
              href="/settings/payment-methods"
              icon={<CardIcon />}
              title="Способы оплаты"
              subtitle={settingsData.defaultPaymentMethodLabel}
              value={settingsData.defaultPaymentMethodLabel}
            />
            <SettingsRow href="/settings/security" icon={<ShieldIcon />} title="Безопасность" />
            {settingsData.role === "ADMIN" ? (
              <SettingsRow href="/admin" icon={<ShieldIcon />} title="Админ-панель" subtitle="Разделы управления" />
            ) : null}
          </div>
        </section>

        <form action={logoutAction} className={styles.logoutForm}>
          <button className={styles.logoutButton} type="submit">
            Выйти из аккаунта
          </button>
        </form>

        <footer className={styles.footer}>
          <p>SubTrack App © 2026</p>
          <p>Контроль и аналитика подписок</p>
        </footer>
      </div>

      <AppMenu />
    </main>
  );
}
