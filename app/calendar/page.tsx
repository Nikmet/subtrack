import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppMenu } from "@/app/components/app-menu/app-menu";
import { SubscriptionIcon } from "@/app/components/subscription-icon/subscription-icon";
import { prisma } from "@/lib/prisma";

import styles from "./calendar.module.css";

export const dynamic = "force-dynamic";

type CalendarPageProps = {
    searchParams: Promise<{
        month?: string;
        day?: string;
    }>;
};

type BillingEvent = {
    id: string;
    subscribeId: string;
    typeName: string;
    typeIcon: string;
    paymentMethodLabel: string | null;
    amount: number;
    date: Date;
    isoDate: string;
};

type CalendarCell = {
    isoDate: string;
    dayNumber: number;
    inCurrentMonth: boolean;
    hasEvents: boolean;
    isSelected: boolean;
    isToday: boolean;
};

const weekdays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

const monthNamesPrepositional = [
    "январе",
    "феврале",
    "марте",
    "апреле",
    "мае",
    "июне",
    "июле",
    "августе",
    "сентябре",
    "октябре",
    "ноябре",
    "декабре"
];

const monthNamesShort = [
    "янв.",
    "фев.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сент.",
    "окт.",
    "нояб.",
    "дек."
];

const makeDate = (year: number, month: number, day: number) => new Date(year, month, day, 12, 0, 0, 0);

const stripTime = (date: Date) => makeDate(date.getFullYear(), date.getMonth(), date.getDate());

const addMonthsClamped = (date: Date, months: number) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const targetFirst = makeDate(year, month + months, 1);
    const lastDay = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0, 12, 0, 0, 0).getDate();

    return makeDate(targetFirst.getFullYear(), targetFirst.getMonth(), Math.min(day, lastDay));
};

const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const toMonthParam = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    return `${year}-${month}`;
};

const parseMonthParam = (input: string | undefined): Date | null => {
    if (!input || !/^\d{4}-\d{2}$/.test(input)) {
        return null;
    }

    const [yearRaw, monthRaw] = input.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
        return null;
    }

    return makeDate(year, month - 1, 1);
};

const parseDayParam = (input: string | undefined): Date | null => {
    if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return null;
    }

    const [yearRaw, monthRaw, dayRaw] = input.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const day = Number(dayRaw);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
    ) {
        return null;
    }

    const parsed = makeDate(year, month - 1, day);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
        return null;
    }

    return parsed;
};

const capitalize = (value: string) => {
    if (!value) {
        return value;
    }

    return value[0].toUpperCase() + value.slice(1);
};

const formatMonthTitle = (date: Date) =>
    capitalize(new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(date));

const formatDayTitle = (date: Date) => new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);

const formatRub = (value: number) =>
    `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(value))}₽`;

const getSubscriptionWord = (count: number) => {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
        return "подписка";
    }

    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
        return "подписки";
    }

    return "подписок";
};

const formatShortDayAndMonth = (date: Date) => `${date.getDate()} ${monthNamesShort[date.getMonth()]}`;

const getEventsForMonth = (
    subscribes: Array<{
        id: string;
        price: { toString(): string };
        period: number;
        nextPaymentAt: Date | null;
        paymentMethodLabel: string | null;
        name: string;
        imgLink: string;
    }>,
    monthStart: Date
) => {
    const monthEnd = makeDate(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const events: BillingEvent[] = [];

    for (const subscribe of subscribes) {
        if (!subscribe.nextPaymentAt) {
            continue;
        }

        const period = Math.max(subscribe.period, 1);
        let occurrence = stripTime(subscribe.nextPaymentAt);
        let safety = 0;

        while (occurrence < monthStart && safety < 240) {
            occurrence = addMonthsClamped(occurrence, period);
            safety += 1;
        }

        while (occurrence >= monthStart && occurrence < monthEnd && safety < 260) {
            events.push({
                id: `${subscribe.id}-${toIsoDate(occurrence)}`,
                subscribeId: subscribe.id,
                typeName: subscribe.name,
                typeIcon: subscribe.imgLink,
                paymentMethodLabel: subscribe.paymentMethodLabel,
                amount: Number(subscribe.price.toString()),
                date: occurrence,
                isoDate: toIsoDate(occurrence)
            });

            occurrence = addMonthsClamped(occurrence, period);
            safety += 1;
        }
    }

    events.sort((a, b) => a.date.getTime() - b.date.getTime() || a.typeName.localeCompare(b.typeName, "ru-RU"));

    return events;
};

const buildCalendarGrid = (
    monthStart: Date,
    selectedIso: string,
    todayIso: string,
    eventsByDay: Map<string, BillingEvent[]>
) => {
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 12, 0, 0, 0).getDate();
    const firstDayMondayIndex = (monthStart.getDay() + 6) % 7;

    const prevMonth = makeDate(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    const daysInPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 12, 0, 0, 0).getDate();

    const visibleCells = Math.ceil((firstDayMondayIndex + daysInMonth) / 7) * 7;
    const cells: CalendarCell[] = [];

    for (let index = 0; index < visibleCells; index += 1) {
        if (index < firstDayMondayIndex) {
            const dayNumber = daysInPrevMonth - firstDayMondayIndex + index + 1;
            const date = makeDate(prevMonth.getFullYear(), prevMonth.getMonth(), dayNumber);
            const isoDate = toIsoDate(date);

            cells.push({
                isoDate,
                dayNumber,
                inCurrentMonth: false,
                hasEvents: false,
                isSelected: false,
                isToday: isoDate === todayIso
            });
            continue;
        }

        const dayInCurrent = index - firstDayMondayIndex + 1;
        if (dayInCurrent <= daysInMonth) {
            const date = makeDate(monthStart.getFullYear(), monthStart.getMonth(), dayInCurrent);
            const isoDate = toIsoDate(date);

            cells.push({
                isoDate,
                dayNumber: dayInCurrent,
                inCurrentMonth: true,
                hasEvents: eventsByDay.has(isoDate),
                isSelected: isoDate === selectedIso,
                isToday: isoDate === todayIso
            });
            continue;
        }

        const dayNumber = dayInCurrent - daysInMonth;
        const nextMonth = makeDate(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
        const date = makeDate(nextMonth.getFullYear(), nextMonth.getMonth(), dayNumber);
        const isoDate = toIsoDate(date);

        cells.push({
            isoDate,
            dayNumber,
            inCurrentMonth: false,
            hasEvents: false,
            isSelected: false,
            isToday: isoDate === todayIso
        });
    }

    return cells;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        redirect("/login");
    }

    const params = await searchParams;
    const now = stripTime(new Date());

    const monthStart = parseMonthParam(params.month) ?? makeDate(now.getFullYear(), now.getMonth(), 1);
    const parsedDay = parseDayParam(params.day);

    let selectedDate = parsedDay ?? now;
    if (selectedDate.getFullYear() !== monthStart.getFullYear() || selectedDate.getMonth() !== monthStart.getMonth()) {
        selectedDate = makeDate(monthStart.getFullYear(), monthStart.getMonth(), 1);
    }

    const selectedIso = toIsoDate(selectedDate);
    const todayIso = toIsoDate(now);

    const subscribes = await prisma.subscribe.findMany({
        where: {
            userId,
            nextPaymentAt: {
                not: null
            }
        },
        select: {
            id: true,
            price: true,
            period: true,
            nextPaymentAt: true,
            paymentMethodLabel: true,
            name: true,
            imgLink: true
        }
    });

    const events = getEventsForMonth(subscribes, monthStart);

    const eventsByDay = new Map<string, BillingEvent[]>();
    for (const event of events) {
        const existing = eventsByDay.get(event.isoDate) ?? [];
        existing.push(event);
        eventsByDay.set(event.isoDate, existing);
    }

    const selectedDayEvents = eventsByDay.get(selectedIso) ?? [];
    const monthTotal = events.reduce((sum, event) => sum + event.amount, 0);
    const monthUniqueSubscriptions = new Set(events.map(event => event.subscribeId)).size;

    const isCurrentMonth = now.getFullYear() === monthStart.getFullYear() && now.getMonth() === monthStart.getMonth();

    const nextEvent = isCurrentMonth
        ? (events.find(event => event.date >= now) ?? events[0] ?? null)
        : (events[0] ?? null);

    const nextMonth = makeDate(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const prevMonth = makeDate(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);

    const monthParam = toMonthParam(monthStart);
    const prevMonthHref = `/calendar?month=${toMonthParam(prevMonth)}&day=${toIsoDate(prevMonth)}`;
    const nextMonthHref = `/calendar?month=${toMonthParam(nextMonth)}&day=${toIsoDate(nextMonth)}`;

    const cells = buildCalendarGrid(monthStart, selectedIso, todayIso, eventsByDay);

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <section className={styles.calendarCard}>
                    <header className={styles.calendarHead}>
                        <h1 className={styles.title}>Календарь оплат</h1>
                        <div className={styles.monthNav}>
                            <Link href={prevMonthHref} className={styles.monthArrow} aria-label="Предыдущий месяц">
                                ‹
                            </Link>
                            <p className={styles.monthTitle}>{formatMonthTitle(monthStart)}</p>
                            <Link href={nextMonthHref} className={styles.monthArrow} aria-label="Следующий месяц">
                                ›
                            </Link>
                        </div>
                    </header>

                    <div className={styles.weekRow}>
                        {weekdays.map(weekday => (
                            <span key={weekday} className={styles.weekday}>
                                {weekday}
                            </span>
                        ))}
                    </div>

                    <div className={styles.grid}>
                        {cells.map(cell => {
                            const href = `/calendar?month=${monthParam}&day=${cell.isoDate}`;
                            const className = [
                                styles.dayCell,
                                cell.inCurrentMonth ? "" : styles.dayCellMuted,
                                cell.isSelected ? styles.dayCellSelected : "",
                                cell.isToday && !cell.isSelected ? styles.dayCellToday : ""
                            ]
                                .filter(Boolean)
                                .join(" ");

                            if (!cell.inCurrentMonth) {
                                return (
                                    <span key={cell.isoDate} className={className} aria-hidden>
                                        <span>{cell.dayNumber}</span>
                                    </span>
                                );
                            }

                            return (
                                <Link key={cell.isoDate} href={href} className={className}>
                                    <span>{cell.dayNumber}</span>
                                    {cell.hasEvents && !cell.isSelected ? <span className={styles.dayDot} /> : null}
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section className={styles.daySection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>{formatDayTitle(selectedDate)}</h2>
                        <p className={styles.sectionMeta}>
                            {selectedDayEvents.length} {getSubscriptionWord(selectedDayEvents.length)}
                        </p>
                    </div>

                    {selectedDayEvents.length === 0 ? (
                        <div className={styles.emptyCard}>
                            <div className={styles.emptyIcon} aria-hidden>
                                <svg viewBox="0 0 24 24">
                                    <path
                                        d="M12 4a5 5 0 0 0-5 5v2.8c0 .5-.2 1-.5 1.4L5 15h14l-1.5-1.8a2 2 0 0 1-.5-1.4V9a5 5 0 0 0-5-5Z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinejoin="round"
                                    />
                                    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" />
                                </svg>
                            </div>
                            <p className={styles.emptyText}>
                                На этот день оплат не запланировано.
                                <br />
                                Отличный день для экономии!
                            </p>
                        </div>
                    ) : (
                        <div className={styles.eventsList}>
                            {selectedDayEvents.map(event => (
                                <article className={styles.eventCard} key={event.id}>
                                    <SubscriptionIcon
                                        src={event.typeIcon}
                                        name={event.typeName}
                                        wrapperClassName={styles.eventIconWrap}
                                        imageClassName={styles.eventIconImage}
                                        fallbackClassName={styles.eventIconFallback}
                                    />
                                    <div className={styles.eventMain}>
                                        <p className={styles.eventName}>{event.typeName}</p>
                                        <p className={styles.eventSubtext}>
                                            {event.paymentMethodLabel ? event.paymentMethodLabel : "Автосписание"}
                                        </p>
                                    </div>
                                    <p className={styles.eventAmount}>{formatRub(event.amount)}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className={styles.summarySection}>
                    <h3 className={styles.summaryTitle}>В этом месяце</h3>
                    <article className={styles.summaryCard}>
                        <p className={styles.summaryLabel}>
                            Всего к оплате в {monthNamesPrepositional[monthStart.getMonth()]}
                        </p>
                        <p className={styles.summaryAmount}>{formatRub(monthTotal)}</p>
                        <div className={styles.summaryBadges}>
                            <span className={styles.badge}>{monthUniqueSubscriptions} активных</span>
                            <span className={styles.badgeAccent}>
                                {nextEvent ? `Следующая: ${formatShortDayAndMonth(nextEvent.date)}` : "Нет оплат"}
                            </span>
                        </div>
                    </article>
                </section>
            </div>

            <AppMenu />
        </main>
    );
}
