-- Remove PREPARING from OrderStatus.
--
-- Written by hand, NOT generated. `prisma migrate diff` compares against the
-- live database and has twice produced destructive SQL on this project; an
-- enum change is small enough to be safer written out than reviewed.
--
-- Postgres cannot drop a value from an enum in place, so the type is rebuilt:
-- rename the old one out of the way, create the new one, cast the column
-- across, drop the old. The DEFAULT has to come off first — a default still
-- referencing the old type blocks the ALTER — and goes back on afterwards.

-- Existing PREPARING orders move back to CONFIRMED. That is the honest
-- landing spot: the brand had accepted them and the courier had not yet been
-- told to collect, which is exactly what CONFIRMED now means. It also keeps
-- them inside EARNS_REVENUE, so no dashboard total shifts.
UPDATE "orders" SET "status" = 'CONFIRMED' WHERE "status" = 'PREPARING';

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

CREATE TYPE "OrderStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'DELIVERED',
  'SETTLED',
  'CANCELLED',
  'CLOSED'
);

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "orders"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING ("status"::text::"OrderStatus");

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "OrderStatus_old";
