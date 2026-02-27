BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF to_regclass('"CommonSubscription"') IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionCategory') THEN
      CREATE TYPE "SubscriptionCategory" AS ENUM ('streaming', 'music', 'games', 'shopping', 'ai', 'finance', 'other');
    END IF;

    CREATE TABLE IF NOT EXISTS "User" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key"
      ON "User" ("email");

    CREATE TABLE IF NOT EXISTS "Type" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "imgLink" TEXT NOT NULL DEFAULT '',
      "price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
      "period" SMALLINT NOT NULL DEFAULT 1,
      CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE IF NOT EXISTS "Subscribe" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "userId" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "imgLink" TEXT NOT NULL DEFAULT '',
      "category" "SubscriptionCategory" NOT NULL DEFAULT 'other',
      "price" DECIMAL(10, 2) NOT NULL DEFAULT 0,
      "period" SMALLINT NOT NULL DEFAULT 1,
      CONSTRAINT "Subscribe_pkey" PRIMARY KEY ("id")
    );

    DO $inner$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Subscribe_userId_fkey'
      ) THEN
        ALTER TABLE "Subscribe"
          ADD CONSTRAINT "Subscribe_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $inner$;

    CREATE INDEX IF NOT EXISTS "Subscribe_userId_idx"
      ON "Subscribe" ("userId");
  END IF;
END $$;

COMMIT;
