-- Star ratings, shown on product cards and aggregated into a store rating.
--
-- orderId is the proof of purchase: a review can only be written against a
-- delivered order containing the product, which is what stops a brand rating
-- its own goods or a competitor rating them down.
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- One review per retailer per product, not per order: a shop that reorders the
-- same crisps every month has one opinion of them, not twelve.
CREATE UNIQUE INDEX "reviews_retailerId_productId_key" ON "reviews"("retailerId", "productId");

-- Listing a product's reviews newest-first is the common read.
CREATE INDEX "reviews_productId_createdAt_idx" ON "reviews"("productId", "createdAt");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Whole stars only. The domain layer checks this too, but a constraint here
-- means no path can write a 0 or a 4.5 whatever the caller does.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
