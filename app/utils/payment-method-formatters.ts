export const normalizeCardNumberInput = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\d* ]/g, "");

export const formatPaymentMethodLabel = (bankName: string, cardNumber: string) => {
  const safeBank = bankName.trim() || "Банк";
  const safeCardNumber = cardNumber.trim() || "****";
  return `${safeBank} • ${safeCardNumber}`;
};
