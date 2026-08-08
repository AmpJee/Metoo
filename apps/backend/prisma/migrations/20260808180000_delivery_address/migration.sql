-- A delivery address, separate from the shop address.
--
-- The two are different facts. The shop address says who this business is and
-- where it trades; the delivery address says where a parcel is handed over,
-- which may be a warehouse, a condo lobby, or whoever is in during the day.
-- Sharing one field forced retailers to choose which truth to store.
--
-- Broken into the parts a Thai courier's label needs: a single free-text line
-- cannot be sorted by district, and every domestic courier wants แขวง/ตำบล and
-- เขต/อำเภอ separately.
--
-- All nullable and purely additive. A retailer who signed up before this
-- existed must still be able to order, so checkout falls back to the shop
-- address until the delivery one is filled in.
ALTER TABLE "retailer_profiles" ADD COLUMN "deliveryRecipient" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "deliveryPhone" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "deliveryAddressLine" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "deliverySubdistrict" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "deliveryDistrict" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "deliveryProvince" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "deliveryPostalCode" TEXT;
