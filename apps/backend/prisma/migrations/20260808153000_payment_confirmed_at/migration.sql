-- When an admin confirmed the bank transfer landed.
--
-- Every other step of the lifecycle stamps a column, and this one is worth
-- keeping for the same reason: "when did we say the money arrived, and who
-- said it" has to stay answerable after the fact.
--
-- Nullable and purely additive — orders that predate the step simply have no
-- value, which is truthful.
ALTER TABLE "orders" ADD COLUMN "paymentConfirmedAt" TIMESTAMP(3);
