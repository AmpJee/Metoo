-- แขวง/ตำบล and เขต/อำเภอ on the shop address.
--
-- The delivery address has had these since 20260808180000; the shop address
-- has only ever had a free-text line, a province and a postcode. That gap is
-- why the settings page asked for a full address in one place and half an
-- address in the other, and why a shop's own address could not be checked
-- against the district data the delivery one is picked from.
--
-- Nullable, and staying that way. Every existing shop has an addressLine with
-- the district buried inside it as prose; a NOT NULL column would need a
-- backfill that guesses, and a guessed district is worse than an absent one
-- because nothing downstream can tell it is a guess.
ALTER TABLE "retailer_profiles" ADD COLUMN "subdistrict" TEXT;
ALTER TABLE "retailer_profiles" ADD COLUMN "district" TEXT;
