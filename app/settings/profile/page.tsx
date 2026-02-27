import Link from "next/link";

import { AppMenu } from "@/app/components/app-menu/app-menu";
import { SettingsProfileToastTrigger } from "@/app/components/toast/settings-profile-toast-trigger";
import { getAuthorizedUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

import { ProfileEditForm } from "./profile-edit-form";
import styles from "./profile.module.css";

export const dynamic = "force-dynamic";

type SettingsProfilePageProps = {
  searchParams: Promise<{
    toast?: string;
  }>;
};

export default async function SettingsProfilePage({ searchParams }: SettingsProfilePageProps) {
  const user = await getAuthorizedUser();
  const params = await searchParams;

  const currentUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      name: true,
      email: true,
      avatarLink: true,
    },
  });

  if (!currentUser) {
    return null;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <SettingsProfileToastTrigger toastType={params.toast} />

        <header className={styles.header}>
          <Link href="/settings" className={styles.backButton} aria-label="Назад в настройки">
            ‹
          </Link>
          <h1 className={styles.title}>Личные данные</h1>
          <span className={styles.spacer} />
        </header>

        <ProfileEditForm user={currentUser} />
      </div>

      <AppMenu />
    </main>
  );
}
