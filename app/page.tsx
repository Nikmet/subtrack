import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import { AppMenu } from "@/app/components/app-menu";
import { SubscriptionIcon } from "@/app/components/subscription-icon";
import { prisma } from "@/lib/prisma";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type SubscriptionItem = {
  id: string;
  typeName: string;
  typeIcon: string;
  period: number;
  monthlyPrice: number;
};

type ScreenData = {
  userName: string;
  userInitials: string;
  monthlyTotal: number;
  subscriptions: SubscriptionItem[];
};

const uiText = {
  monthlyCost: "МЕСЯЧНАЯ СТОИМОСТЬ",
  perMonth: "/мес.",
  activeSubs: "активных подписок",
  subscriptionsTitle: "Ваши подписки",
  monthlyLabel: "Ежемесячно",
  periodLabel: "оплачено на",
  monthsShort: "мес.",
  emptyState: "У вас пока нет подписок.",
  logout: "Выйти",
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

async function getScreenData(userId: string): Promise<ScreenData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscribes: {
        orderBy: { id: "asc" },
        include: {
          type: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const subscriptions = user.subscribes.map((subscribe) => {
    const price = Number(subscribe.price.toString());
    const period = Math.max(subscribe.period, 1);

    return {
      id: subscribe.id,
      typeName: subscribe.type.name,
      typeIcon: subscribe.type.imgLink,
      period,
      monthlyPrice: price / period,
    };
  });

  const monthlyTotal = subscriptions.reduce(
    (sum, subscription) => sum + subscription.monthlyPrice,
    0,
  );

  return {
    userName: user.name,
    userInitials: getInitials(user.name),
    monthlyTotal,
    subscriptions,
  };
}

async function logoutAction() {
  "use server";

  await signOut({ redirectTo: "/login" });
}

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const screenData = await getScreenData(userId);

  if (!screenData) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <header className={styles.topBar}>
            <Image src="/logo.svg" alt="SubTrack" width={142} height={33} priority />
            <form action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                {uiText.logout}
              </button>
            </form>
          </header>
          <p className={styles.emptyState}>{uiText.emptyState}</p>
        </div>
        <AppMenu />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.topBar}>
          <Image src="/logo.svg" alt="SubTrack" width={142} height={33} priority />

          <div className={styles.topActions}>
            <form action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                {uiText.logout}
              </button>
            </form>

            <Link className={styles.avatarLink} href="/profile" aria-label="Profile">
              <div className={styles.avatar} aria-label={screenData.userName}>
                {screenData.userInitials}
              </div>
            </Link>
          </div>
        </header>

        <div className={styles.layout}>
          <section className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{uiText.monthlyCost}</p>
            <div className={styles.summaryAmountRow}>
              <span className={styles.summaryAmount}>
                {"\u20BD"}
                {formatRub(Math.round(screenData.monthlyTotal))}
              </span>
              <span className={styles.summaryPerMonth}>{uiText.perMonth}</span>
            </div>
            <div className={styles.summaryBadge}>
              <span className={styles.summaryBadgeDot} />
              <span>
                {screenData.subscriptions.length} {uiText.activeSubs}
              </span>
            </div>
          </section>

          <section className={styles.subscriptionsSection}>
            <div className={styles.subscriptionsHeader}>
              <h1 className={styles.subscriptionsTitle}>{uiText.subscriptionsTitle}</h1>
            </div>

            <div className={styles.subscriptionsList}>
              {screenData.subscriptions.map((subscription) => (
                <article className={styles.subscriptionCard} key={subscription.id}>
                  <SubscriptionIcon
                    src={subscription.typeIcon}
                    name={subscription.typeName}
                    wrapperClassName={styles.subscriptionIconWrap}
                    imageClassName={styles.subscriptionIcon}
                    fallbackClassName={styles.subscriptionFallback}
                  />

                  <div className={styles.subscriptionMain}>
                    <h2 className={styles.subscriptionName}>{subscription.typeName}</h2>
                    <p className={styles.subscriptionPeriod}>
                      {uiText.periodLabel} {subscription.period} {uiText.monthsShort}
                    </p>
                  </div>

                  <div className={styles.subscriptionPriceBlock}>
                    <p className={styles.subscriptionPrice}>
                      {formatRub(Math.round(subscription.monthlyPrice))}
                      {"\u20BD"}
                    </p>
                    <p className={styles.subscriptionPriceLabel}>{uiText.monthlyLabel}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <AppMenu />
    </main>
  );
}
