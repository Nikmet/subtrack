import type { CSSProperties } from "react";

import { CATEGORY_BAR_COLORS } from "@/app/constants/home";
import { formatRub } from "@/app/utils/home-formatters";
import type { CategoryStat } from "@/app/types/home";

import styles from "./category-stat-item.module.css";

type CategoryStatItemProps = {
    item: CategoryStat;
    index: number;
};

export function CategoryStatItem({ item, index }: CategoryStatItemProps) {
    return (
        <article className={styles.categoryItem}>
            <div className={styles.categoryHead}>
                <p className={styles.categoryName}>{item.name}</p>
                <p className={styles.categoryValue}>{formatRub(item.amount)}</p>
            </div>
            <div className={styles.progressTrack} aria-hidden>
                <div
                    className={styles.progressFill}
                    style={
                        {
                            width: `${Math.max(0, Math.min(item.share, 100))}%`,
                            "--bar-color": CATEGORY_BAR_COLORS[index % CATEGORY_BAR_COLORS.length]
                        } as CSSProperties
                    }
                />
            </div>
            <p className={styles.categoryShare}>{Math.round(item.share)}% от общих расходов</p>
        </article>
    );
}
