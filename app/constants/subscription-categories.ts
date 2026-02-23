export const SUBSCRIPTION_CATEGORY_VALUES = [
  "streaming",
  "music",
  "games",
  "shopping",
  "ai",
  "finance",
  "other",
] as const;

export type SubscriptionCategory = (typeof SUBSCRIPTION_CATEGORY_VALUES)[number];

export const DEFAULT_SUBSCRIPTION_CATEGORY: SubscriptionCategory = "other";

export const SUBSCRIPTION_CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  streaming: "Стриминг",
  music: "Музыка",
  games: "Игры",
  shopping: "Покупки",
  ai: "AI",
  finance: "Финансы",
  other: "Прочее",
};

export const SUBSCRIPTION_CATEGORIES = SUBSCRIPTION_CATEGORY_VALUES.map((value) => ({
  value,
  label: SUBSCRIPTION_CATEGORY_LABELS[value],
}));

export const isSubscriptionCategory = (value: string): value is SubscriptionCategory =>
  SUBSCRIPTION_CATEGORY_VALUES.some((item) => item === value);

export const getSubscriptionCategoryLabel = (value: string): string => {
  if (!isSubscriptionCategory(value)) {
    return SUBSCRIPTION_CATEGORY_LABELS[DEFAULT_SUBSCRIPTION_CATEGORY];
  }

  return SUBSCRIPTION_CATEGORY_LABELS[value];
};
