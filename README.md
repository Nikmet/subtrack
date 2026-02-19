# SubTrack

Приложение для учета подписок на Next.js + Prisma + PostgreSQL.

## Запуск

```bash
bun install
bun run dev
```

Откройте `http://localhost:3000`.

## Переменные окружения

В `.env` должны быть:

- `DATABASE_URL`
- `AUTH_SECRET`

## Сид базы данных

```bash
bunx prisma db execute --file prisma/seed.sql
```

## Тестовые аккаунты

Пароль для всех аккаунтов: `Subtrack123!`

- `ivan.petrov@subtrack.local`
- `anna.smirnova@subtrack.local`
- `dmitry.ivanov@subtrack.local`
- `maria.volkova@subtrack.local`
