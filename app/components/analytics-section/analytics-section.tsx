import Link from "next/link";

import { CategoryStatItem } from "../category-stat-item/category-stat-item";
import { formatRub } from "@/app/utils/home-formatters";
import type { CategoryStat } from "@/app/types/home";

import styles from "./analytics-section.module.css";

type AnalyticsSectionProps = {
    categoryStats: CategoryStat[];
    categoryTotal: number;
};

export function AnalyticsSection({ categoryStats, categoryTotal }: AnalyticsSectionProps) {
    return (
        <aside className={styles.rightColumn}>
            <section className={styles.categorySection}>
                <div className={styles.analyticsHeader}>
                    <h2 className={styles.analyticsTitle}>Аналитика</h2>
                    <p className={styles.analyticsTotal}>{formatRub(categoryTotal)} /мес</p>
                </div>

                {categoryStats.length > 0 ? (
                    <div className={styles.categoryList}>
                        {categoryStats.map((item, index) => (
                            <CategoryStatItem key={item.name} item={item} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.categoryEmpty}>
                        <p className={styles.categoryEmptyText}>
                            Добавьте подписки, чтобы увидеть структуру расходов по категориям.
                        </p>
                        <Link href="/search" className={styles.categoryEmptyLink}>
                            Добавить подписку
                        </Link>
                    </div>
                )}
            </section>
        </aside>
    );
}
