-- Volume pricing: a ladder of quantity thresholds per product.
--
-- Written by hand rather than generated. `prisma migrate diff` compares
-- against the live database and has produced destructive SQL on this project
-- more than once; a single new table is small enough to be safer written out
-- than reviewed.
--
-- Purely additive: no existing column changes, so products without tiers keep
-- charging pricePerPackMinor exactly as before.

CREATE TABLE "product_price_tiers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minPacks" INTEGER NOT NULL,
    "pricePerPackMinor" INTEGER NOT NULL,

    CONSTRAINT "product_price_tiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_price_tiers_productId_idx"
    ON "product_price_tiers"("productId");

-- One price per threshold. Without this a product could hold two tiers at the
-- same quantity and the effective price would depend on row order.
CREATE UNIQUE INDEX "product_price_tiers_productId_minPacks_key"
    ON "product_price_tiers"("productId", "minPacks");

ALTER TABLE "product_price_tiers"
    ADD CONSTRAINT "product_price_tiers_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
