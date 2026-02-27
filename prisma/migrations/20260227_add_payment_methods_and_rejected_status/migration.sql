BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'CommonSubscriptionStatus'
      AND e.enumlabel = 'REJECTED'
  ) THEN
    ALTER TYPE "CommonSubscriptionStatus" ADD VALUE 'REJECTED';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PaymentMethod" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentMethod_userId_fkey'
  ) THEN
    ALTER TABLE "PaymentMethod"
      ADD CONSTRAINT "PaymentMethod_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PaymentMethod_userId_idx"
  ON "PaymentMethod"("userId");

CREATE INDEX IF NOT EXISTS "PaymentMethod_userId_isDefault_idx"
  ON "PaymentMethod"("userId", "isDefault");

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethod_userId_label_key"
  ON "PaymentMethod"("userId", "label");

ALTER TABLE "UserSubscription"
  ADD COLUMN IF NOT EXISTS "paymentMethodId" UUID;

INSERT INTO "PaymentMethod" ("id", "userId", "label", "isDefault")
SELECT
  gen_random_uuid(),
  src."userId",
  src."paymentCardLabel",
  false
FROM (
  SELECT DISTINCT "userId", TRIM("paymentCardLabel") AS "paymentCardLabel"
  FROM "UserSubscription"
  WHERE TRIM(COALESCE("paymentCardLabel", '')) <> ''
) AS src
ON CONFLICT ("userId", "label") DO NOTHING;

INSERT INTO "PaymentMethod" ("id", "userId", "label", "isDefault")
SELECT
  gen_random_uuid(),
  u."id",
  'Автосписание',
  false
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1
  FROM "PaymentMethod" pm
  WHERE pm."userId" = u."id"
    AND pm."label" = 'Автосписание'
);

WITH ranked AS (
  SELECT
    pm."id",
    ROW_NUMBER() OVER (
      PARTITION BY pm."userId"
      ORDER BY pm."isDefault" DESC, pm."createdAt" ASC, pm."id" ASC
    ) AS rn
  FROM "PaymentMethod" pm
)
UPDATE "PaymentMethod" pm
SET "isDefault" = ranked.rn = 1,
    "updatedAt" = CURRENT_TIMESTAMP
FROM ranked
WHERE ranked."id" = pm."id";

UPDATE "UserSubscription" us
SET "paymentMethodId" = pm."id"
FROM "PaymentMethod" pm
WHERE us."paymentMethodId" IS NULL
  AND pm."userId" = us."userId"
  AND pm."label" = TRIM(COALESCE(us."paymentCardLabel", ''));

UPDATE "UserSubscription" us
SET "paymentMethodId" = pm."id"
FROM "PaymentMethod" pm
WHERE us."paymentMethodId" IS NULL
  AND pm."userId" = us."userId"
  AND pm."label" = 'Автосписание';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'UserSubscription_paymentMethodId_fkey'
  ) THEN
    ALTER TABLE "UserSubscription"
      ADD CONSTRAINT "UserSubscription_paymentMethodId_fkey"
      FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "UserSubscription_paymentMethodId_idx"
  ON "UserSubscription"("paymentMethodId");

COMMIT;
