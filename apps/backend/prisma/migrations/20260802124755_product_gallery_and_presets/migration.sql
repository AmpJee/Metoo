-- AlterTable
ALTER TABLE "products" ADD COLUMN     "galleryUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "packPresets" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

