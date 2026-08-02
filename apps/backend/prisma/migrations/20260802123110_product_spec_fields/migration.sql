-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "packWeightGrams" INTEGER,
ADD COLUMN     "shelfLifeDays" INTEGER,
ADD COLUMN     "sku" TEXT;

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_brandId_sku_key" ON "products"("brandId", "sku");

