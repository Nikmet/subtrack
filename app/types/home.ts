export type SubscriptionListItem = {
    id: string;
    price: number;
    monthlyPrice: number;
    period: number;
    nextPaymentAt: Date | null;
    typeName: string;
    typeImage: string;
    categoryName: string;
};

export type CategoryStat = {
    name: string;
    amount: number;
    share: number;
};

export type HomeScreenData = {
    userInitials: string;
    monthlyTotal: number;
    subscriptionsCount: number;
    subscriptions: SubscriptionListItem[];
    categoryStats: CategoryStat[];
    categoryTotal: number;
};
