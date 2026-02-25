BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommonSubscriptionStatus') THEN
    CREATE TYPE "CommonSubscriptionStatus" AS ENUM ('PENDING', 'PUBLISHED');
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "banReason" TEXT,
  ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);

ALTER TABLE "CommonSubscription"
  ADD COLUMN IF NOT EXISTS "status" "CommonSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "createdByUserId" UUID,
  ADD COLUMN IF NOT EXISTS "moderatedByUserId" UUID,
  ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "moderationComment" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "CommonSubscription"
SET "status" = 'PUBLISHED'
WHERE "status" = 'PENDING';

UPDATE "User"
SET "role" = 'ADMIN'
WHERE "email" = 'metlov.nm@yandex.ru';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CommonSubscription_createdByUserId_fkey'
  ) THEN
    ALTER TABLE "CommonSubscription"
      ADD CONSTRAINT "CommonSubscription_createdByUserId_fkey"
      FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CommonSubscription_moderatedByUserId_fkey'
  ) THEN
    ALTER TABLE "CommonSubscription"
      ADD CONSTRAINT "CommonSubscription_moderatedByUserId_fkey"
      FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "CommonSubscription_status_idx"
  ON "CommonSubscription"("status");

CREATE INDEX IF NOT EXISTS "CommonSubscription_createdByUserId_idx"
  ON "CommonSubscription"("createdByUserId");

CREATE INDEX IF NOT EXISTS "CommonSubscription_moderatedByUserId_idx"
  ON "CommonSubscription"("moderatedByUserId");

COMMIT;
