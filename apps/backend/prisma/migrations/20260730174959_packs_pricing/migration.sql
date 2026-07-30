-- Products are sold BY THE PACK.
--
-- Written as RENAMEs rather than drop-and-add so existing rows keep their
-- values: the meaning of each column is unchanged, only its name and the unit
-- it is documented in.
ALTER TABLE "products" RENAME COLUMN "unitPriceMinor" TO "pricePerPackMinor";
ALTER TABLE "products" RENAME COLUMN "moq" TO "minPacks";
ALTER TABLE "products" RENAME COLUMN "caseSize" TO "unitsPerPack";
ALTER TABLE "products" RENAME COLUMN "stockQty" TO "stockPacks";

ALTER TABLE "cart_items" RENAME COLUMN "quantity" TO "packs";

ALTER TABLE "order_items" RENAME COLUMN "unitPriceMinor" TO "pricePerPackMinor";
ALTER TABLE "order_items" RENAME COLUMN "quantity" TO "packs";

-- Snapshot of units-per-pack at the time of sale, so a past order still reads
-- correctly after the brand repackages. Existing rows predate packs, so 1 is
-- the only truthful backfill.
ALTER TABLE "order_items" ADD COLUMN "unitsPerPack" INTEGER NOT NULL DEFAULT 1;
