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

- `DB_DATABASE_URL`
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

## Vercel Blob (subscription icons)

Subscription icon upload now uses Vercel Blob via `POST /api/uploads/icon`.

1. In Vercel Dashboard open your project and connect a Blob store.
2. Ensure `BLOB_READ_WRITE_TOKEN` is available in project environment variables.
3. For local development pull envs or set token manually in `.env.local`:

```bash
vercel env pull .env.local
```

or add:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

After that, create a subscription with an uploaded icon. The `imgLink` field will store a public Blob URL.

## Prisma reset workflow

```bash
bunx prisma validate
bunx prisma db push --force-reset
bunx prisma generate
bunx prisma db execute --file prisma/seed.sql
```

`prisma.config.ts` uses `DB_DATABASE_URL`, so this variable must be present in your env.
