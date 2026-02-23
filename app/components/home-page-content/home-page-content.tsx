import { AppMenu } from "@/app/components/app-menu/app-menu";

import { AnalyticsSection } from "../analytics-section/analytics-section";
import { HomeHeader } from "../home-header/home-header";
import { SummaryCard } from "../summary-card/summary-card";
import { SubscriptionsSection } from "../subscriptions-section/subscriptions-section";
import type { HomeScreenData } from "@/app/types/home";

import styles from "./home-page-content.module.css";

type HomePageContentProps = {
    screenData: HomeScreenData;
};

export function HomePageContent({ screenData }: HomePageContentProps) {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <HomeHeader userInitials={screenData.userInitials} />

                <div className={styles.layout}>
                    <div className={styles.leftColumn}>
                        <SummaryCard
                            monthlyTotal={screenData.monthlyTotal}
                            subscriptionsCount={screenData.subscriptionsCount}
                        />
                        <SubscriptionsSection subscriptions={screenData.subscriptions} />
                    </div>

                    <AnalyticsSection
                        categoryStats={screenData.categoryStats}
                        categoryTotal={screenData.categoryTotal}
                    />
                </div>
            </div>

            <AppMenu />
        </main>
    );
}
