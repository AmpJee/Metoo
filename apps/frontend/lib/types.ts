/**
 * API response shapes, mirroring the TypeBox `response` schemas in
 * apps/backend/src/modules/*. Keep them in step: /openapi is the contract.
 *
 * Enums are imported from @metoo/shared rather than redeclared, so a new
 * order status cannot drift between the two apps.
 */
import type {
  Category,
  PriceTier,
  OrderStatus,
  PaymentPreference,
  PipelineStatus,
  Role,
  ShopType,
} from '@metoo/shared'

export type {
  Category,
  OrderStatus,
  PaymentPreference,
  PipelineStatus,
  Role,
  ShopType,
}

// --- auth ------------------------------------------------------------------

export interface PublicUser {
  id: string
  email: string
  role: Role
  status: PipelineStatus
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

export interface Me extends PublicUser {
  brand: { id: string; name: string } | null
  retailer: { id: string; shopName: string } | null
}

export interface Session {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

// --- catalog ---------------------------------------------------------------

export interface BrandStub {
  id: string
  name: string
  logoUrl: string | null
  province: string
}

export interface Rating {
  /** Null, not zero — an unrated product is not a badly rated one. */
  average: number | null
  count: number
}

export interface CatalogProduct {
  id: string
  name: string
  description: string | null
  photoUrl: string | null
  pricePerPackMinor: number
  minPacks: number
  unitsPerPack: number
  category: Category
  stockPacks: number | null
  createdAt: string
  brand: BrandStub
  rating: Rating
}

/**
 * GET /catalog/products/:id — the browse shape plus everything only the
 * detail screen renders. Kept apart from CatalogProduct because a 24-item
 * browse page has no use for a pricing ladder per row.
 */
export interface CatalogProductDetail extends CatalogProduct {
  packPresets: number[]
  /** Grams per pack. What the delivery estimate on the page is priced from. */
  packWeightGrams: number | null
  /** Volume pricing, cheapest threshold first. Empty when there is none. */
  priceTiers: PriceTier[]
}

export interface CatalogPage {
  items: CatalogProduct[]
  /** Null means the last page. Pass it back as `cursor` for the next one. */
  nextCursor: string | null
}

// --- cart ------------------------------------------------------------------

export interface CartItem {
  id: string
  packs: number
  lineTotalMinor: number
  product: {
    id: string
    name: string
    photoUrl: string | null
    pricePerPackMinor: number
    minPacks: number
    unitsPerPack: number
    isActive: boolean
  }
}

export interface CartGroup {
  brand: { id: string; name: string }
  items: CartItem[]
  subtotalMinor: number
  /** Delivery for this brand's parcel. Zero once the order qualifies. */
  shippingMinor: number
  /** How much more this brand needs for free delivery. Zero once free. */
  toFreeShippingMinor: number
}

export interface Cart {
  /** How many orders checkout will create — one per brand. */
  brandCount: number
  itemCount: number
  /** Goods only. */
  subtotalMinor: number
  /** Delivery across every brand parcel. */
  shippingMinor: number
  /** Subtotal + shipping: what the retailer transfers. */
  totalMinor: number
  /** True until their first order — delivery is on metoo, so shipping is 0. */
  firstOrderFreeShipping: boolean
  groups: CartGroup[]
}

// --- checkout & orders -----------------------------------------------------

export interface CheckoutResult {
  checkoutGroupId: string
  orderCount: number
  totalMinor: number
  orders: { id: string; orderNumber: string; totalMinor: number }[]
}

/**
 * GET /orders/group/:checkoutGroupId — an envelope, not a bare array. The
 * API totals the group itself, so the confirmation screen never re-adds it.
 */
export interface OrderGroup {
  checkoutGroupId: string
  orderCount: number
  totalMinor: number
  orders: Order[]
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  pricePerPackMinor: number
  packs: number
  lineTotalMinor: number
}

export interface Order {
  id: string
  orderNumber: string
  checkoutGroupId: string
  status: OrderStatus
  subtotalMinor: number
  shippingMinor: number
  totalMinor: number
  /** Snapshot taken at checkout, so it stays true if the profile changes. */
  shippingAddress: {
    addressLine?: string
    province?: string
    postalCode?: string
    phone?: string
  } | null
  /** When the buyer sent their transfer slip. The file is admin-only. */
  paymentSlipAt: string | null
  paymentConfirmedAt: string | null
  confirmedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  createdAt: string
  brand: { id: string; name: string; logoUrl: string | null }
  items: OrderItem[]
}

// --- account profiles ------------------------------------------------------

export interface RetailerProfile {
  id: string
  shopName: string
  phone: string
  addressLine: string
  province: string
  postalCode: string
  taxId: string | null
  avatarUrl: string | null

  /** The operational details the console's Retailers table shows. */
  shopType: ShopType | null
  zone: string | null
  currentProducts: string | null
  monthlyCapacity: number | null
  preferredPayment: PaymentPreference | null
  deliveryWindow: string | null

  /** Blank required fields. Empty means this shop can check out. */
  missingForCheckout: Array<{ field: string; label: string }>
  updatedAt: string
}

export interface BrandProfile {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  phone: string
  addressLine: string
  province: string
  postalCode: string
  bankName: string | null
  bankAccountName: string | null
  /** Never the full number — bank details are admin-only PII. */
  bankAccountLast4: string | null
}

/** Step one of the two-step avatar upload. */
export interface SignedUpload {
  uploadUrl: string
  storageKey: string
}

// --- reviews ---------------------------------------------------------------

export interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  retailer: { id: string; shopName: string; province: string }
}

/** GET /products/:id/reviews/mine — drives the review form's initial state. */
export interface OwnReview {
  /** False until a delivered order containing this product exists. */
  canReview: boolean
  review: Review | null
}

// --- saved lists -----------------------------------------------------------

export interface SavedStatus {
  favourite: boolean
  savedForLater: boolean
}

export type SavedKind = 'FAVOURITE' | 'SAVED_FOR_LATER'

export interface ToggleResult {
  saved: boolean
  kind: SavedKind
}

export interface SavedProduct {
  savedAt: string
  id: string
  name: string
  photoUrl: string | null
  pricePerPackMinor: number
  minPacks: number
  unitsPerPack: number
  category: Category
  /** False once the brand retires it — still listed, but flagged. */
  isActive: boolean
  brand: { id: string; name: string }
}

// --- storefront ------------------------------------------------------------

export interface StorefrontProduct {
  id: string
  name: string
  photoUrl: string | null
  pricePerPackMinor: number
  minPacks: number
  unitsPerPack: number
  category: Category
  stockPacks: number | null
  rating: Rating
}

export interface Storefront {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  province: string
  memberSince: string
  rating: Rating
  followerCount: number
  productCount: number
  /** Null for a viewer who is not a retailer. */
  following: boolean | null
  products: StorefrontProduct[]
}

export interface FollowResult {
  following: boolean
  followerCount: number
}

/**
 * A brand in the directory. From GET /catalog/brands — note it is NOT
 * GET /stores, which is the brand's own preview of its storefront.
 */
export interface BrandListItem extends BrandStub {
  rating: Rating
}

// --- returns ---------------------------------------------------------------

export type ReturnStatus = 'REQUESTED' | 'ACCEPTED' | 'REJECTED'

export interface ReturnRequest {
  id: string
  reason: string
  photoUrls: string[]
  status: ReturnStatus
  /** The reviewer's message to the buyer — shown so a decision is explicable. */
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string
  order: {
    id: string
    orderNumber: string
    status: OrderStatus
    totalMinor: number
    brand: { id: string; name: string }
    retailer: { id: string; shopName: string }
  }
}

// --- seller (BRAND) --------------------------------------------------------

/** A move the API says is legal from the order's current state. */
export interface OrderAction {
  to: OrderStatus
  label: string
}

export type DashboardPeriod = 'day' | 'week' | 'month' | 'year'

export interface BrandDashboard {
  period: DashboardPeriod
  store: {
    name: string
    memberSince: string | null
    activeProducts: number
    totalProducts: number
    newOrders: number
    rating: Rating
  }
  revenueMinor: number
  orderCount: number
  averageOrderValueMinor: number
  repeatOrderRate: {
    repeatOrders: number
    totalOrders: number
    percent: number
  }
  /** A real time series — the only chartable series on either dashboard. */
  chart: { date: string; valueMinor: number; count: number }[]
  stock: {
    id: string
    name: string
    photoUrl: string | null
    stockPacks: number | null
    isActive: boolean
    needsAttention: boolean
  }[]
  recentOrders: {
    id: string
    orderNumber: string
    status: OrderStatus
    totalMinor: number
    createdAt: string
  }[]
}

export interface BrandOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  subtotalMinor: number
  totalMinor: number
  /** What the brand keeps after commission. */
  payoutMinor: number
  commissionBps: number
  commissionMinor: number
  paymentMethod: 'PROMPTPAY' | 'CASH' | 'CARD'
  shippingAddress: Order['shippingAddress']
  confirmedAt: string | null
  readyForPickupAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  settledAt: string | null
  createdAt: string
  retailer: { id: string; shopName: string; province: string }
  items: {
    id: string
    productId: string
    productName: string
    pricePerPackMinor: number
    unitsPerPack: number
    packs: number
    lineTotalMinor: number
  }[]
  actions: OrderAction[]
}

export interface BrandProduct {
  /** Volume pricing, cheapest threshold first. Empty when there is none. */
  priceTiers: PriceTier[]
  id: string
  brandId: string
  name: string
  description: string | null
  photoUrl: string | null
  pricePerPackMinor: number
  minPacks: number
  unitsPerPack: number
  /** Grams per pack. What the delivery fee is priced from. */
  packWeightGrams: number | null
  category: Category
  stockPacks: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WalletBalance {
  availableMinor: number
  /** Payout on delivered orders not yet confirmed as Money Received. */
  pendingClearanceMinor: number
  minWithdrawalMinor: number
  bankName: string | null
  bankAccountLast4: string | null
}

export type WalletTxnType =
  | 'SALE_CREDIT'
  | 'COMMISSION_DEBIT'
  | 'REFUND_DEBIT'
  | 'WITHDRAWAL_DEBIT'
  | 'ADJUSTMENT'

export interface WalletTransaction {
  id: string
  type: WalletTxnType
  /** Signed: credits positive, debits negative. */
  amountMinor: number
  note: string | null
  createdAt: string
  order: { id: string; orderNumber: string } | null
  withdrawal: { id: string; bankName: string } | null
}

export type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PAID'

export interface Withdrawal {
  id: string
  amountMinor: number
  status: WithdrawalStatus
  bankName: string
  bankAccountName: string
  reviewNote: string | null
  paymentRef: string | null
  paidAt: string | null
  createdAt: string
}

export interface BrandCustomer {
  id: string
  shopName: string
  shopType: string | null
  province: string
  zone: string | null
  phone: string
  orderCount: number
  totalSpentMinor: number
  firstOrderAt: string | null
  lastOrderAt: string | null
  isRepeat: boolean
}

// --- admin -----------------------------------------------------------------

export interface AdminSummary {
  period: DashboardPeriod
  onboarding: {
    brandsOnboarded: number
    brandsInPipeline: number
    retailersOnboarded: number
    retailersInPipeline: number
  }
  orderCount: number
  gmvMinor: number
  averageOrderValueMinor: number
  commissionMinor: number
  logisticsCostMinor: number
  /** Commission minus logistics. No gateway yet, so no payment fees term. */
  contributionMarginMinor: number
  repeatOrderRate: {
    repeatOrders: number
    totalOrders: number
    percent: number
  }
  /** Null until something has been delivered. */
  averageFulfilmentHours: number | null
  /** Null until a retailer has placed a first order. */
  averageDaysToFirstOrder: number | null
  gmvByBrand: { brandId: string; name: string; gmvMinor: number }[]
}

export interface BrandPipelineFields {
  id: string
  name: string
  phone: string
  province: string
  fdaStatus: 'YES' | 'PENDING' | 'NO'
  sizeBand: string | null
  socialHandle: string | null
  caseWeightKg: number | null
  caseDimensionsCm: string | null
  caseUnits: number | null
  existingRetailerCount: number | null
  referralSource: string | null
  adminNotes: string | null
  _count: { products: number }
}

export interface RetailerPipelineFields {
  id: string
  shopName: string
  phone: string
  province: string
  shopType: string | null
  zone: string | null
  socialHandle: string | null
  currentProducts: string | null
  monthlyCapacity: number | null
  preferredPayment: 'PROMPTPAY' | 'CASH' | 'CARD' | null
  paymentReliability: 'ON_TIME' | 'PENDING' | 'LATE'
  deliveryWindow: string | null
  referralSource: string | null
  adminNotes: string | null
}

export interface Applicant {
  id: string
  email: string
  role: Role
  status: PipelineStatus
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  brand: BrandPipelineFields | null
  retailer: RetailerPipelineFields | null
}

export interface VerificationDocument {
  id: string
  type: 'SME_ID' | 'NATIONAL_ID' | 'FDA_CERT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  /** Short-lived signed URL — link to it, never cache it. */
  url: string
}

export interface AdminOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  subtotalMinor: number
  totalMinor: number
  commissionBps: number
  commissionMinor: number
  payoutMinor: number
  /** What logistics cost the platform, entered by admin after the fact. */
  deliveryCostMinor: number
  paymentMethod: 'PROMPTPAY' | 'CASH' | 'CARD'
  /** Set once the buyer sends a slip; fetch the file itself separately. */
  paymentSlipAt: string | null
  paymentConfirmedAt: string | null
  confirmedAt: string | null
  deliveredAt: string | null
  settledAt: string | null
  createdAt: string
  brand: { id: string; name: string }
  retailer: { id: string; shopName: string; province: string }
  items: { productName: string; packs: number; lineTotalMinor: number }[]
  actions: OrderAction[]
}

export interface AdminWithdrawal extends Withdrawal {
  /** Full number, admin-only — it is what the transfer is made against. */
  bankAccountNumber: string
  reviewedBy: string | null
  reviewedAt: string | null
  brand: { id: string; name: string }
}

export type FeedbackStatus = 'OPEN' | 'RESOLVED'

export interface Feedback {
  id: string
  authorRole: Role
  authorLabel: string
  message: string
  status: FeedbackStatus
  adminNote: string | null
  resolvedAt: string | null
  createdAt: string
}

/** From GET /following — the retailer's own followed brands. */
export interface FollowedBrand {
  followedAt: string
  id: string
  name: string
  logoUrl: string | null
  province: string
  followerCount: number
}
