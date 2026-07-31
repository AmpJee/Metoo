-- The marketplace shows two save actions per product card: "Add to favorites"
-- and "Save for later". They are different intents — a lasting preference
-- versus "not this order, maybe the next one" — so a product can be in both.
CREATE TYPE "SavedItemKind" AS ENUM ('FAVOURITE', 'SAVED_FOR_LATER');

ALTER TABLE "favourites"
  ADD COLUMN "kind" "SavedItemKind" NOT NULL DEFAULT 'FAVOURITE';

-- The unique key gains the kind, so the same product can be favourited and
-- saved for later at once.
DROP INDEX "favourites_retailerId_productId_key";
CREATE UNIQUE INDEX "favourites_retailerId_productId_kind_key"
  ON "favourites"("retailerId", "productId", "kind");

CREATE INDEX "favourites_retailerId_kind_idx" ON "favourites"("retailerId", "kind");
