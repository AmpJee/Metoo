/**
 * API response shapes, mirroring the TypeBox `response` schemas in
 * apps/backend/src/modules/*. Keep them in step: /openapi is the contract.
 *
 * Enums are imported from @metoo/shared rather than redeclared, so a new
 * order status cannot drift between the two apps.
 */
import type { Category, OrderStatus, PipelineStatus, Role } from '@metoo/shared'

export type { Category, OrderStatus, PipelineStatus, Role }

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
}

export interface Cart {
  /** How many orders checkout will create — one per brand. */
  brandCount: number
  itemCount: number
  totalMinor: number
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
  confirmedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  createdAt: string
  brand: { id: string; name: string; logoUrl: string | null }
  items: OrderItem[]
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

/** From GET /following — the retailer's own followed brands. */
export interface FollowedBrand {
  followedAt: string
  id: string
  name: string
  logoUrl: string | null
  province: string
  followerCount: number
}
