-- The admin console tracks accounts through a sales pipeline rather than a
-- signup approval queue. The same column doubles as the authorisation gate:
-- only ONBOARDED accounts can trade.
CREATE TYPE "PipelineStatus" AS ENUM ('NOT_CONTACTED', 'CONTACTED', 'INTERESTED', 'ONBOARDED', 'DECLINED');
CREATE TYPE "FdaStatus" AS ENUM ('YES', 'PENDING', 'NO');
CREATE TYPE "SizeBand" AS ENUM ('SIZE_1_5', 'SIZE_6_20', 'SIZE_21_50', 'SIZE_51_PLUS');
CREATE TYPE "ShopType" AS ENUM ('MINIMART', 'SUNDRIES', 'SPECIALTY', 'MARKET_STALL');
CREATE TYPE "PaymentPreference" AS ENUM ('PROMPTPAY', 'CASH', 'CARD');
CREATE TYPE "PaymentReliability" AS ENUM ('ON_TIME', 'PENDING', 'LATE');

-- Map the old approval states onto the pipeline rather than dropping the
-- column, so existing accounts keep working: an APPROVED account was cleared
-- to trade and must stay that way.
ALTER TABLE "users" ADD COLUMN "pipelineStatus" "PipelineStatus" NOT NULL DEFAULT 'NOT_CONTACTED';

UPDATE "users" SET "pipelineStatus" = CASE "status"::text
  WHEN 'APPROVED'          THEN 'ONBOARDED'::"PipelineStatus"
  WHEN 'REJECTED'          THEN 'DECLINED'::"PipelineStatus"
  WHEN 'RESUBMIT_REQUIRED' THEN 'INTERESTED'::"PipelineStatus"
  ELSE 'NOT_CONTACTED'::"PipelineStatus"
END;

ALTER TABLE "users" DROP COLUMN "status";
ALTER TABLE "users" RENAME COLUMN "pipelineStatus" TO "status";
DROP TYPE "AccountStatus";

-- Outreach fields the console shows. All nullable: they are filled in by admin
-- over the course of a sales conversation, not at signup.
ALTER TABLE "brand_profiles"
  ADD COLUMN "fdaStatus" "FdaStatus" NOT NULL DEFAULT 'NO',
  ADD COLUMN "sizeBand" "SizeBand",
  ADD COLUMN "socialHandle" TEXT,
  ADD COLUMN "caseWeightKg" DECIMAL(6,2),
  ADD COLUMN "caseDimensionsCm" TEXT,
  ADD COLUMN "caseUnits" INTEGER,
  ADD COLUMN "existingRetailerCount" INTEGER,
  ADD COLUMN "referralSource" TEXT,
  ADD COLUMN "adminNotes" TEXT;

ALTER TABLE "retailer_profiles"
  ADD COLUMN "shopType" "ShopType",
  ADD COLUMN "zone" TEXT,
  ADD COLUMN "socialHandle" TEXT,
  ADD COLUMN "currentProducts" TEXT,
  ADD COLUMN "monthlyCapacity" INTEGER,
  ADD COLUMN "preferredPayment" "PaymentPreference",
  ADD COLUMN "paymentReliability" "PaymentReliability" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "deliveryWindow" TEXT,
  ADD COLUMN "referralSource" TEXT,
  ADD COLUMN "adminNotes" TEXT;

CREATE INDEX "users_role_status_idx" ON "users"("role", "status");
