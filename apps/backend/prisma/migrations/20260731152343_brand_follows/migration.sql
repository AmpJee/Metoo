-- Every storefront in the design shows a follower count and a Follow button.
CREATE TABLE "brand_follows" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_follows_pkey" PRIMARY KEY ("id")
);

-- Unique per pair: following twice is idempotent rather than inflating the count.
CREATE UNIQUE INDEX "brand_follows_retailerId_brandId_key" ON "brand_follows"("retailerId", "brandId");
-- Counting a brand's followers is the common read.
CREATE INDEX "brand_follows_brandId_idx" ON "brand_follows"("brandId");

ALTER TABLE "brand_follows" ADD CONSTRAINT "brand_follows_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "brand_follows" ADD CONSTRAINT "brand_follows_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
