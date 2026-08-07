/**
 * Enum labels, in both languages.
 *
 * These mirror the `*_LABELS` maps in `@metoo/shared`, which stay put: the
 * package is the English source of truth and the backend reads the enum lists
 * beside them. Duplicating only the *labels* here is what lets a Thai reader
 * see a Thai category name without the shared package growing a locale.
 *
 * The key types below are built from the shared enums with template literals,
 * so adding a `Category` or an `OrderStatus` upstream fails the build here
 * until someone decides what it is called in both languages. That is the whole
 * point of keeping them typed rather than as a loose Record<string, string>.
 */

import type {
  Category,
  FdaStatus,
  OrderStatus,
  PaymentPreference,
  PaymentReliability,
  PipelineStatus,
  ShopType,
  SizeBand,
} from '@metoo/shared'

/** Wallet ledger entry types — the `WalletTxnType` enum in the Prisma schema. */
type WalletTxnType =
  | 'SALE_CREDIT'
  | 'COMMISSION_DEBIT'
  | 'REFUND_DEBIT'
  | 'WITHDRAWAL_DEBIT'
  | 'ADJUSTMENT'

/** Verification document types — the `DocumentType` enum in the Prisma schema. */
type DocumentType = 'SME_ID' | 'NATIONAL_ID' | 'FDA_CERT'

/** Withdrawal request states — the `WithdrawalStatus` enum in the Prisma schema. */
type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID'

type EnumKey =
  | `category.${Category}`
  // Two order-status namespaces on purpose. `status.*` is the buyer's wording
  // and `orderStatus.*` is the console's — the same row means different things
  // to the two sides, which is why @metoo/shared carries two maps as well.
  | `status.${OrderStatus}`
  | `orderStatus.${OrderStatus}`
  // The wording on a transition button, keyed by destination status rather than
  // taken from the API's `label`. See components/order-actions.tsx.
  | `action.${OrderStatus}`
  | `pipeline.${PipelineStatus}`
  | `fda.${FdaStatus}`
  | `sizeBand.${SizeBand}`
  | `shopType.${ShopType}`
  | `payment.${PaymentPreference}`
  | `reliability.${PaymentReliability}`
  | `withdrawal.${WithdrawalStatus}`
  | `txn.${WalletTxnType}`
  | `doc.${DocumentType}`

export const en: Record<EnumKey, string> = {
  // --- categories ----------------------------------------------------------
  'category.FOOD_BEVERAGE': 'Food & Beverage',
  'category.HEALTH_BEAUTY': 'Health & Beauty',
  'category.HOME_LIVING': 'Home & Living',
  'category.FASHION_ACCESSORIES': 'Fashion & Accessories',

  // --- order status, as the buyer reads it ---------------------------------
  'status.PENDING': 'To Pay',
  'status.CONFIRMED': 'Confirmed',
  'status.READY_FOR_PICKUP': 'Package Pickup',
  'status.PICKED_UP': 'Out for Delivery',
  'status.DELIVERED': 'Delivered',
  'status.SETTLED': 'Completed',
  'status.CANCELLED': 'Cancelled',
  'status.CLOSED': 'Closed',

  // --- order status, as the seller and admin read it -----------------------
  'orderStatus.PENDING': 'Incoming',
  'orderStatus.CONFIRMED': 'Confirmed',
  'orderStatus.READY_FOR_PICKUP': 'Package Pickup',
  'orderStatus.PICKED_UP': 'Out for Delivery',
  'orderStatus.DELIVERED': 'Delivered',
  'orderStatus.SETTLED': 'Money Received',
  'orderStatus.CANCELLED': 'Cancelled',
  'orderStatus.CLOSED': 'Closed',

  // --- transition buttons, keyed by destination ----------------------------
  'action.PENDING': 'Reopen',
  'action.CONFIRMED': 'Confirm Order',
  'action.READY_FOR_PICKUP': 'Package Pickup',
  'action.PICKED_UP': 'Out for Delivery',
  'action.DELIVERED': 'Mark Delivered',
  'action.SETTLED': 'Confirm Delivered',
  'action.CANCELLED': 'Cancel Order',
  'action.CLOSED': 'Close Order',

  // --- sales pipeline ------------------------------------------------------
  'pipeline.NOT_CONTACTED': 'Not Contacted',
  'pipeline.CONTACTED': 'Contacted',
  'pipeline.INTERESTED': 'Interested',
  'pipeline.ONBOARDED': 'Onboarded',
  'pipeline.DECLINED': 'Declined',

  // --- อย. (Thai FDA) ------------------------------------------------------
  'fda.YES': 'Certified',
  'fda.PENDING': 'Pending',
  'fda.NO': 'None',

  // --- headcount -----------------------------------------------------------
  'sizeBand.SIZE_1_5': '1–5 people',
  'sizeBand.SIZE_6_20': '6–20 people',
  'sizeBand.SIZE_21_50': '21–50 people',
  'sizeBand.SIZE_51_PLUS': '51+ people',

  // --- shop type -----------------------------------------------------------
  'shopType.MINIMART': 'Minimart',
  'shopType.SUNDRIES': 'Sundries',
  'shopType.SPECIALTY': 'Specialty',
  'shopType.MARKET_STALL': 'Market stall',

  // --- payment -------------------------------------------------------------
  'payment.PROMPTPAY': 'PromptPay',
  'payment.CASH': 'Cash on delivery',
  'payment.CARD': 'Card',

  'reliability.ON_TIME': 'On time',
  'reliability.PENDING': 'Pending',
  'reliability.LATE': 'Late',

  // --- withdrawals ---------------------------------------------------------
  'withdrawal.REQUESTED': 'Requested',
  'withdrawal.APPROVED': 'Approved',
  'withdrawal.REJECTED': 'Rejected',
  'withdrawal.PAID': 'Paid',

  // --- wallet ledger -------------------------------------------------------
  'txn.SALE_CREDIT': 'Sale',
  'txn.COMMISSION_DEBIT': 'Commission',
  'txn.REFUND_DEBIT': 'Refund',
  'txn.WITHDRAWAL_DEBIT': 'Withdrawal',
  'txn.ADJUSTMENT': 'Adjustment',

  // --- verification documents ----------------------------------------------
  'doc.SME_ID': 'SME registration',
  'doc.NATIONAL_ID': 'National ID',
  'doc.FDA_CERT': 'อย. certificate',
}

export const th: Record<EnumKey, string> = {
  // --- categories ----------------------------------------------------------
  'category.FOOD_BEVERAGE': 'อาหารและเครื่องดื่ม',
  'category.HEALTH_BEAUTY': 'สุขภาพและความงาม',
  'category.HOME_LIVING': 'ของใช้ในบ้าน',
  'category.FASHION_ACCESSORIES': 'แฟชั่นและเครื่องประดับ',

  // --- order status, as the buyer reads it ---------------------------------
  'status.PENDING': 'รอชำระเงิน',
  'status.CONFIRMED': 'ยืนยันแล้ว',
  'status.READY_FOR_PICKUP': 'รอเข้ารับพัสดุ',
  'status.PICKED_UP': 'กำลังจัดส่ง',
  'status.DELIVERED': 'จัดส่งแล้ว',
  'status.SETTLED': 'สำเร็จ',
  'status.CANCELLED': 'ยกเลิก',
  'status.CLOSED': 'ปิดรายการ',

  // --- order status, as the seller and admin read it -----------------------
  // PENDING is work arriving, not money owed; SETTLED is the payday.
  'orderStatus.PENDING': 'ออร์เดอร์ใหม่',
  'orderStatus.CONFIRMED': 'ยืนยันแล้ว',
  'orderStatus.READY_FOR_PICKUP': 'รอเข้ารับพัสดุ',
  'orderStatus.PICKED_UP': 'กำลังจัดส่ง',
  'orderStatus.DELIVERED': 'จัดส่งแล้ว',
  'orderStatus.SETTLED': 'ได้รับเงินแล้ว',
  'orderStatus.CANCELLED': 'ยกเลิก',
  'orderStatus.CLOSED': 'ปิดรายการ',

  // --- transition buttons, keyed by destination ----------------------------
  'action.PENDING': 'เปิดรายการใหม่',
  'action.CONFIRMED': 'รับออร์เดอร์',
  'action.READY_FOR_PICKUP': 'พร้อมให้เข้ารับ',
  'action.PICKED_UP': 'เริ่มจัดส่ง',
  'action.DELIVERED': 'ทำเครื่องหมายว่าจัดส่งแล้ว',
  'action.SETTLED': 'ยืนยันรับสินค้า',
  'action.CANCELLED': 'ยกเลิกออร์เดอร์',
  'action.CLOSED': 'ปิดรายการ',

  // --- sales pipeline ------------------------------------------------------
  'pipeline.NOT_CONTACTED': 'ยังไม่ได้ติดต่อ',
  'pipeline.CONTACTED': 'ติดต่อแล้ว',
  'pipeline.INTERESTED': 'สนใจ',
  'pipeline.ONBOARDED': 'เปิดใช้งานแล้ว',
  'pipeline.DECLINED': 'ปฏิเสธ',

  // --- อย. (Thai FDA) ------------------------------------------------------
  'fda.YES': 'มี อย.',
  'fda.PENDING': 'กำลังยื่นขอ',
  'fda.NO': 'ไม่มี',

  // --- headcount -----------------------------------------------------------
  'sizeBand.SIZE_1_5': '1–5 คน',
  'sizeBand.SIZE_6_20': '6–20 คน',
  'sizeBand.SIZE_21_50': '21–50 คน',
  'sizeBand.SIZE_51_PLUS': '51 คนขึ้นไป',

  // --- shop type -----------------------------------------------------------
  'shopType.MINIMART': 'มินิมาร์ท',
  'shopType.SUNDRIES': 'ร้านขายของชำ',
  'shopType.SPECIALTY': 'ร้านสินค้าเฉพาะทาง',
  'shopType.MARKET_STALL': 'แผงตลาด',

  // --- payment -------------------------------------------------------------
  // PromptPay keeps its English name — that is what the sticker on the counter
  // says and what everyone calls it out loud.
  'payment.PROMPTPAY': 'PromptPay',
  'payment.CASH': 'เก็บเงินปลายทาง',
  'payment.CARD': 'บัตรเครดิต/เดบิต',

  'reliability.ON_TIME': 'ชำระตรงเวลา',
  'reliability.PENDING': 'รอชำระ',
  'reliability.LATE': 'ชำระล่าช้า',

  // --- withdrawals ---------------------------------------------------------
  'withdrawal.REQUESTED': 'ยื่นคำขอแล้ว',
  'withdrawal.APPROVED': 'อนุมัติแล้ว',
  'withdrawal.REJECTED': 'ไม่อนุมัติ',
  'withdrawal.PAID': 'โอนเงินแล้ว',

  // --- wallet ledger -------------------------------------------------------
  'txn.SALE_CREDIT': 'ยอดขาย',
  'txn.COMMISSION_DEBIT': 'ค่าคอมมิชชั่น',
  'txn.REFUND_DEBIT': 'คืนเงิน',
  'txn.WITHDRAWAL_DEBIT': 'ถอนเงิน',
  'txn.ADJUSTMENT': 'รายการปรับปรุง',

  // --- verification documents ----------------------------------------------
  'doc.SME_ID': 'ทะเบียน SME',
  'doc.NATIONAL_ID': 'บัตรประชาชน',
  'doc.FDA_CERT': 'ใบรับรอง อย.',
}
