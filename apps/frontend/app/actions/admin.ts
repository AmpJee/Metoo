'use server'

import { revalidatePath } from 'next/cache'
import { ApiError, api } from '@/lib/api'
import type { OrderStatus, PipelineStatus } from '@/lib/types'

/**
 * Admin console mutations.
 *
 * Every one of these writes an audit log entry server-side, so the console
 * does not need to record anything itself — it just needs to surface the
 * API's refusal when a move is not allowed.
 */

type Result = { ok: true } | { ok: false; error: string }

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof ApiError) return { ok: false, error: error.message }
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

function revalidatePipeline() {
  revalidatePath('/admin/sellers')
  revalidatePath('/admin/retailers')
  revalidatePath('/admin')
}

// --- pipeline --------------------------------------------------------------

/**
 * Move an account along the pipeline.
 *
 * ONBOARDED is the gate — until an account reaches it, every trading route
 * returns 403. DECLINED requires a note, which the applicant sees.
 */
export async function setPipelineStatus(
  userId: string,
  status: PipelineStatus,
  reviewNote?: string
): Promise<Result> {
  try {
    await api.patch(`/admin/pipeline/${userId}/status`, {
      status,
      ...(reviewNote ? { reviewNote } : {}),
    })
    revalidatePipeline()
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

/** Outreach data an admin maintains; the applicant never edits these. */
export async function updatePipelineFields(
  userId: string,
  body: { brand?: Record<string, unknown>; retailer?: Record<string, unknown> }
): Promise<Result> {
  try {
    await api.patch(`/admin/pipeline/${userId}/fields`, body)
    revalidatePipeline()
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

// --- orders ----------------------------------------------------------------

export async function adminTransitionOrder(
  orderId: string,
  to: OrderStatus
): Promise<Result> {
  try {
    // `status`, not `to` — see the note in seller.ts.
    await api.patch(`/admin/orders/${orderId}/status`, { status: to })
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

/**
 * Record what delivery actually cost.
 *
 * Entered after the fact, when the courier invoice arrives — it feeds the
 * contribution-margin figure on the summary.
 */
export async function setDeliveryCost(
  orderId: string,
  deliveryCostMinor: number
): Promise<Result> {
  try {
    await api.patch(`/admin/orders/${orderId}/delivery-cost`, {
      deliveryCostMinor,
    })
    revalidatePath('/admin/orders')
    revalidatePath(`/admin/orders/${orderId}`)
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

// --- withdrawals -----------------------------------------------------------

export async function approveWithdrawal(
  id: string,
  reviewNote?: string
): Promise<Result> {
  try {
    await api.patch(
      `/admin/withdrawals/${id}/approve`,
      reviewNote ? { reviewNote } : undefined
    )
    revalidatePath('/admin/withdrawals')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

/** A note is required — the brand is told why their payout was refused. */
export async function rejectWithdrawal(
  id: string,
  reviewNote: string
): Promise<Result> {
  try {
    await api.patch(`/admin/withdrawals/${id}/reject`, { reviewNote })
    revalidatePath('/admin/withdrawals')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

/** `paymentRef` is the bank's transfer reference — the audit trail. */
export async function markWithdrawalPaid(
  id: string,
  paymentRef: string
): Promise<Result> {
  try {
    await api.patch(`/admin/withdrawals/${id}/paid`, { paymentRef })
    revalidatePath('/admin/withdrawals')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

// --- returns & feedback ----------------------------------------------------

export async function adminReviewReturn(
  id: string,
  decision: 'accept' | 'reject',
  reviewNote?: string
): Promise<Result> {
  try {
    await api.patch(
      `/admin/returns/${id}/${decision}`,
      reviewNote ? { reviewNote } : undefined
    )
    revalidatePath('/admin/returns')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}

export async function resolveFeedback(
  id: string,
  adminNote?: string
): Promise<Result> {
  try {
    await api.patch(
      `/admin/feedback/${id}/resolve`,
      adminNote ? { adminNote } : undefined
    )
    revalidatePath('/admin/feedback')
    return { ok: true }
  } catch (error) {
    return fail(error)
  }
}
