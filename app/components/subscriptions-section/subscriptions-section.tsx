import { SubscriptionListItem } from "../subscription-list-item/subscription-list-item";
import type { SubscriptionListItem as SubscriptionListItemType } from "@/app/types/home";

import styles from "./subscriptions-section.module.css";

type SubscriptionsSectionProps = {
    subscriptions: SubscriptionListItemType[];
};

export function SubscriptionsSection({ subscriptions }: SubscriptionsSectionProps) {
    return (
        <section className={styles.subscriptionsSection}>
            <h2 className={styles.sectionTitle}>Мои подписки</h2>

            {subscriptions.length > 0 ? (
                <div className={styles.subscriptionsList}>
                    {subscriptions.map(item => (
                        <SubscriptionListItem key={item.id} item={item} />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>Подписок пока нет. Добавьте первую подписку через поиск.</div>
            )}
        </section>
    );
}
