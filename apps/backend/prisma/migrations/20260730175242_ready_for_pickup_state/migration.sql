-- The seller's order tracker has seven steps; the enum was missing the one
-- between packing and collection.
--
-- Postgres appends new enum values at the end regardless of declaration order,
-- so BEFORE 'PICKED_UP' is what keeps the stored ordering meaningful.
ALTER TYPE "OrderStatus" ADD VALUE 'READY_FOR_PICKUP' BEFORE 'PICKED_UP';

ALTER TABLE "orders" ADD COLUMN "readyForPickupAt" TIMESTAMP(3);
