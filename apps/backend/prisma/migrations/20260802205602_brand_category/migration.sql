-- NOTE: `prisma migrate diff --from-config-datasource` compares against the
-- LIVE database, which already carries product_images, retailer avatarUrl and
-- the galleryUrls drop from three unmerged branches. The generated diff
-- therefore wanted to DROP the product_images table, re-add galleryUrls and
-- DROP avatarUrl — silently reverting all of them. Reduced by hand to the one
-- change this migration is for. Two branches sharing one dev database is the
-- cause; this is the second time it has happened today.

-- AlterTable
ALTER TABLE "brand_profiles" ADD COLUMN     "category" "Category";
