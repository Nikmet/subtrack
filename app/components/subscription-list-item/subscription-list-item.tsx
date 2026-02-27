import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";

import { formatNextPayment, formatRub } from "@/app/utils/home-formatters";
import { formatPeriodLabel } from "@/app/utils/subscription-formatters";
import type { SubscriptionListItem as SubscriptionListItemType } from "@/app/types/home";

import styles from "./subscription-list-item.module.css";

type SubscriptionListItemProps = {
    item: SubscriptionListItemType;
};

export function SubscriptionListItem({ item }: SubscriptionListItemProps) {
    return (
        <article className={styles.subscriptionCard}>
            <SubscriptionIcon
                src={item.typeImage}
                name={item.typeName}
                wrapperClassName={styles.subscriptionIconWrap}
                imageClassName={styles.subscriptionIcon}
                fallbackClassName={styles.subscriptionFallback}
            />

            <div className={styles.subscriptionMain}>
                <h3 className={styles.subscriptionName}>{item.typeName}</h3>
                <p className={styles.subscriptionMeta}>
                    {item.categoryName} • {formatNextPayment(item.nextPaymentAt)} • {formatPeriodLabel(item.period)}
                </p>
            </div>

            <div className={styles.subscriptionPriceBlock}>
                <p className={styles.subscriptionPrice}>{formatRub(item.monthlyPrice)}</p>
                <p className={styles.subscriptionPriceLabel}>в месяц</p>
            </div>
        </article>
    );
}
