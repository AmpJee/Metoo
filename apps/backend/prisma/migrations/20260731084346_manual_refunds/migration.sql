-- Refunds were modelled against Stripe: paymentId and stripeRefundId were both
-- required. Payment is manual, so no Payment rows exist and the table could
-- never be written to.
--
-- A refund now attaches to the ORDER, which always exists. The gateway columns
-- stay for when one is added: a card refund would fill providerRefundId, a
-- bank transfer fills reference instead.
--
-- The table is empty, so this drops and recreates rather than migrating rows.
DROP TABLE IF EXISTS "refunds";

CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "providerRefundId" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "reference" TEXT,
    "reason" TEXT,
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");
CREATE INDEX "refunds_orderId_idx" ON "refunds"("orderId");

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
