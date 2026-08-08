-- The retailer's bank transfer slip.
--
-- Payment is manual, so the only evidence an admin has that money moved is the
-- slip the buyer photographs. Stored as a key into the PRIVATE bucket rather
-- than a URL: a slip shows an account number and a name, and a public URL is
-- forever, while a signed one expires.
--
-- The timestamp is separate from the key so the buyer's own order screen can
-- say "sent, awaiting check" without being handed the key to the object.
--
-- Both nullable and purely additive: orders paid before this existed simply
-- have no slip, which is what actually happened.
ALTER TABLE "orders" ADD COLUMN "paymentSlipKey" TEXT;
ALTER TABLE "orders" ADD COLUMN "paymentSlipAt" TIMESTAMP(3);
