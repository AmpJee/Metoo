-- The admin order table shows how each order was paid and what delivery cost
-- the platform, which together give the contribution-margin figure on the
-- dashboard.
--
-- paymentMethod records intent chosen at checkout, not a gateway result:
-- payment is manual at MVP and the seller confirms receipt by moving the order
-- to SETTLED.
ALTER TABLE "orders"
  ADD COLUMN "paymentMethod" "PaymentPreference" NOT NULL DEFAULT 'PROMPTPAY',
  ADD COLUMN "deliveryCostMinor" INTEGER NOT NULL DEFAULT 0;
