-- Create categories table
CREATE TABLE IF NOT EXISTS "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");

-- Seed base categories used by search and manual creation flow.
-- ON CONFLICT DO NOTHING keeps migration idempotent for both slug/name duplicates.
INSERT INTO "Category" ("slug", "name")
VALUES
  ('streaming', 'Стриминг'),
  ('music', 'Музыка'),
  ('games', 'Игры'),
  ('shopping', 'Шопинг'),
  ('ai', 'AI'),
  ('finance', 'Финансы'),
  ('other', 'Прочее')
ON CONFLICT DO NOTHING;

-- Extend Type with category relation
ALTER TABLE "Type" ADD COLUMN IF NOT EXISTS "categoryId" UUID;

UPDATE "Type"
SET "categoryId" = (
  SELECT c."id"
  FROM "Category" c
  WHERE c."slug" = 'streaming' OR c."name" = 'Стриминг'
  ORDER BY CASE WHEN c."slug" = 'streaming' THEN 0 ELSE 1 END
  LIMIT 1
)
WHERE "categoryId" IS NULL
  AND "name" IN ('Netflix', 'YouTube Premium', 'VK Combo', 'KION', 'Yandex Plus');

UPDATE "Type"
SET "categoryId" = (
  SELECT c."id"
  FROM "Category" c
  WHERE c."slug" = 'music' OR c."name" = 'Музыка'
  ORDER BY CASE WHEN c."slug" = 'music' THEN 0 ELSE 1 END
  LIMIT 1
)
WHERE "categoryId" IS NULL
  AND "name" IN ('Spotify Premium');

UPDATE "Type"
SET "categoryId" = (
  SELECT c."id"
  FROM "Category" c
  WHERE c."slug" = 'ai' OR c."name" = 'AI'
  ORDER BY CASE WHEN c."slug" = 'ai' THEN 0 ELSE 1 END
  LIMIT 1
)
WHERE "categoryId" IS NULL
  AND "name" IN ('ChatGPT Plus');

UPDATE "Type"
SET "categoryId" = (
  SELECT c."id"
  FROM "Category" c
  WHERE c."slug" = 'finance' OR c."name" = 'Финансы'
  ORDER BY CASE WHEN c."slug" = 'finance' THEN 0 ELSE 1 END
  LIMIT 1
)
WHERE "categoryId" IS NULL
  AND "name" IN ('T-Bank Pro');

UPDATE "Type"
SET "categoryId" = (
  SELECT c."id"
  FROM "Category" c
  WHERE c."slug" = 'other' OR c."name" = 'Прочее'
  ORDER BY CASE WHEN c."slug" = 'other' THEN 0 ELSE 1 END
  LIMIT 1
)
WHERE "categoryId" IS NULL;

ALTER TABLE "Type"
  ALTER COLUMN "categoryId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Type_categoryId_fkey'
  ) THEN
    ALTER TABLE "Type"
      ADD CONSTRAINT "Type_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Extend Subscribe with creation-form fields
ALTER TABLE "Subscribe" ADD COLUMN IF NOT EXISTS "nextPaymentAt" TIMESTAMP(3);
ALTER TABLE "Subscribe" ADD COLUMN IF NOT EXISTS "paymentMethodLabel" TEXT;
