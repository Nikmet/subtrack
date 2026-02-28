BEGIN;

CREATE TABLE IF NOT EXISTS "Bank" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "iconLink" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Bank_name_key"
  ON "Bank"("name");

ALTER TABLE "PaymentMethod"
  ADD COLUMN IF NOT EXISTS "cardNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "bankId" UUID;

INSERT INTO "Bank" ("name", "iconLink")
SELECT DISTINCT
  CASE
    WHEN LOWER(pm."label") LIKE '%visa%' THEN 'Visa'
    WHEN LOWER(pm."label") LIKE '%master%' THEN 'Mastercard'
    WHEN LOWER(pm."label") LIKE '%mir%' THEN 'Мир'
    WHEN LOWER(pm."label") LIKE '%sber%' THEN 'Сбер'
    WHEN LOWER(pm."label") LIKE '%t-bank%' OR LOWER(pm."label") LIKE '%tinkoff%' THEN 'Т-Банк'
    WHEN LOWER(pm."label") LIKE '%alfa%' THEN 'Альфа-Банк'
    ELSE 'Неизвестный банк'
  END AS "name",
  CASE
    WHEN LOWER(pm."label") LIKE '%visa%' THEN 'https://cdn.simpleicons.org/visa/1A1F71'
    WHEN LOWER(pm."label") LIKE '%master%' THEN 'https://cdn.simpleicons.org/mastercard/EB001B'
    WHEN LOWER(pm."label") LIKE '%mir%' THEN 'https://cdn.simpleicons.org/mir/1FAF64'
    WHEN LOWER(pm."label") LIKE '%sber%' THEN 'https://cdn.simpleicons.org/sberbank/21A038'
    WHEN LOWER(pm."label") LIKE '%t-bank%' OR LOWER(pm."label") LIKE '%tinkoff%' THEN 'https://www.tbank.ru/static/images/share/tinkoff_black.png'
    WHEN LOWER(pm."label") LIKE '%alfa%' THEN 'https://cdn.simpleicons.org/alfaromeo/981E32'
    ELSE 'https://cdn.simpleicons.org/bankofamerica/012169'
  END AS "iconLink"
FROM "PaymentMethod" pm
WHERE pm."label" IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

UPDATE "PaymentMethod" pm
SET "cardNumber" =
  CASE
    WHEN regexp_replace(pm."label", '\D', '', 'g') ~ '\d{4,}$' THEN
      '**** ' || RIGHT(regexp_replace(pm."label", '\D', '', 'g'), 4)
    ELSE
      pm."label"
  END
WHERE pm."cardNumber" IS NULL;

UPDATE "PaymentMethod" pm
SET "bankId" = b."id"
FROM "Bank" b
WHERE pm."bankId" IS NULL
  AND b."name" = (
    CASE
      WHEN LOWER(pm."label") LIKE '%visa%' THEN 'Visa'
      WHEN LOWER(pm."label") LIKE '%master%' THEN 'Mastercard'
      WHEN LOWER(pm."label") LIKE '%mir%' THEN 'Мир'
      WHEN LOWER(pm."label") LIKE '%sber%' THEN 'Сбер'
      WHEN LOWER(pm."label") LIKE '%t-bank%' OR LOWER(pm."label") LIKE '%tinkoff%' THEN 'Т-Банк'
      WHEN LOWER(pm."label") LIKE '%alfa%' THEN 'Альфа-Банк'
      ELSE 'Неизвестный банк'
    END
  );

UPDATE "PaymentMethod" pm
SET "bankId" = b."id"
FROM "Bank" b
WHERE pm."bankId" IS NULL
  AND b."name" = 'Неизвестный банк';

ALTER TABLE "PaymentMethod"
  ALTER COLUMN "cardNumber" SET NOT NULL,
  ALTER COLUMN "bankId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'PaymentMethod_bankId_fkey'
  ) THEN
    ALTER TABLE "PaymentMethod"
      ADD CONSTRAINT "PaymentMethod_bankId_fkey"
      FOREIGN KEY ("bankId") REFERENCES "Bank"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "PaymentMethod_userId_label_key";

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethod_userId_cardNumber_key"
  ON "PaymentMethod"("userId", "cardNumber");

CREATE INDEX IF NOT EXISTS "PaymentMethod_bankId_idx"
  ON "PaymentMethod"("bankId");

ALTER TABLE "PaymentMethod"
  DROP COLUMN IF EXISTS "label";

COMMIT;
