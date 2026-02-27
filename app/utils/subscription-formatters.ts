const toMonthsWord = (value: number) => {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "месяц";
  }

  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return "месяца";
  }

  return "месяцев";
};

export const formatPeriodLabel = (period: number) => {
  const safePeriod = Math.max(Math.trunc(period), 1);

  if (safePeriod === 1) {
    return "Ежемесячно";
  }

  if (safePeriod === 12) {
    return "Раз в год";
  }

  return `Раз в ${safePeriod} ${toMonthsWord(safePeriod)}`;
};
