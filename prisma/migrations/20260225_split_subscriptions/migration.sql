BEGIN;

CREATE TABLE "CommonSubscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "imgLink" TEXT NOT NULL,
  "category" "SubscriptionCategory" NOT NULL,
  "price" DECIMAL(10, 2) NOT NULL,
  "period" SMALLINT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommonSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSubscription" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "commonSubscriptionId" UUID NOT NULL,
  "nextPaymentAt" TIMESTAMP(3) NOT NULL,
  "paymentCardLabel" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

INSERT INTO "CommonSubscription" (
  "id",
  "name",
  "imgLink",
  "category",
  "price",
  "period"
)
SELECT
  "id",
  "name",
  "imgLink",
  "category",
  "price",
  "period"
FROM "Subscribe";

INSERT INTO "UserSubscription" (
  "id",
  "userId",
  "commonSubscriptionId",
  "nextPaymentAt",
  "paymentCardLabel"
)
SELECT
  "id",
  "userId",
  "id",
  COALESCE(
    "nextPaymentAt",
    date_trunc('day', CURRENT_TIMESTAMP) + make_interval(months => GREATEST("period", 1))
  ),
  COALESCE(NULLIF("paymentMethodLabel", ''), 'Автосписание')
FROM "Subscribe";

ALTER TABLE "UserSubscription"
  ADD CONSTRAINT "UserSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserSubscription"
  ADD CONSTRAINT "UserSubscription_commonSubscriptionId_fkey"
  FOREIGN KEY ("commonSubscriptionId") REFERENCES "CommonSubscription"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "UserSubscription_userId_commonSubscriptionId_key"
  ON "UserSubscription"("userId", "commonSubscriptionId");

CREATE INDEX "UserSubscription_userId_nextPaymentAt_idx"
  ON "UserSubscription"("userId", "nextPaymentAt");

CREATE INDEX "UserSubscription_commonSubscriptionId_idx"
  ON "UserSubscription"("commonSubscriptionId");

CREATE INDEX "CommonSubscription_name_idx"
  ON "CommonSubscription"("name");

CREATE INDEX "CommonSubscription_category_idx"
  ON "CommonSubscription"("category");

DROP TABLE "Subscribe";

COMMIT;
