"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./app-menu.module.css";

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      d="M3 10.8 12 4l9 6.8v8.2a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <circle
      cx="11"
      cy="11"
      r="6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle
      cx="12"
      cy="10"
      r="2.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M7.5 17a5.5 5.5 0 0 1 9 0" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" />
    <path
      d="M8 9.5h8M8 12h8M8 14.5h5.5"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

export function AppMenu() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isCalendar = pathname.startsWith("/calendar");
  const isSearch = pathname.startsWith("/search");
  const isProfile =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/notifications");
  const isCreate = pathname.startsWith("/subscriptions/new");

  return (
    <nav className={styles.menu} aria-label="Main menu">
      <Link href="/" className={styles.brand} aria-label="SubsManager">
        <span className={styles.brandIcon}>
          <LogoIcon />
        </span>
        <span className={styles.brandText}>SubsManager</span>
      </Link>

      <Link
        href="/"
        className={`${styles.item} ${styles.home} ${isHome ? styles.active : ""}`}
      >
        <span className={styles.icon}>
          <HomeIcon />
        </span>
        <span className={styles.label}>Домашняя</span>
      </Link>

      <Link
        href="/calendar"
        className={`${styles.item} ${styles.calendar} ${isCalendar ? styles.active : ""}`}
      >
        <span className={styles.icon}>
          <CalendarIcon />
        </span>
        <span className={styles.label}>Календарь</span>
      </Link>

      <Link
        href="/subscriptions/new"
        className={`${styles.plus} ${styles.plusControl} ${isCreate ? styles.plusActive : ""}`}
        aria-label="Добавить подписку"
      >
        <PlusIcon />
      </Link>

      <Link
        href="/search"
        className={`${styles.item} ${styles.search} ${isSearch ? styles.active : ""}`}
      >
        <span className={styles.icon}>
          <SearchIcon />
        </span>
        <span className={styles.label}>Поиск</span>
      </Link>

      <Link
        href="/profile"
        className={`${styles.item} ${styles.profile} ${isProfile ? styles.active : ""}`}
      >
        <span className={styles.icon}>
          <ProfileIcon />
        </span>
        <span className={styles.label}>Профиль</span>
      </Link>
    </nav>
  );
}
