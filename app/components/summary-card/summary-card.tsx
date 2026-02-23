import { formatRub, formatSubscriptionCount } from "@/app/utils/home-formatters";

import styles from "./summary-card.module.css";

type SummaryCardProps = {
    monthlyTotal: number;
    subscriptionsCount: number;
};

export function SummaryCard({ monthlyTotal, subscriptionsCount }: SummaryCardProps) {
    return (
        <aside className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Ежемесячные расходы</p>
            <div className={styles.summaryAmountRow}>
                <p className={styles.summaryAmount}>{formatRub(monthlyTotal)}</p>
                <span className={styles.summaryPerMonth}>/мес</span>
            </div>
            <div className={styles.summaryBadge}>
                <span className={styles.summaryBadgeDot} aria-hidden />
                {formatSubscriptionCount(subscriptionsCount)}
            </div>
        </aside>
    );
}
