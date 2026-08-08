import { NextResponse } from 'next/server'
import { ApiError, api } from '@/lib/api'

/**
 * Open a buyer's transfer slip.
 *
 * A redirect rather than a server action returning a URL, because the signed
 * link is minted per request and expires: an anchor the admin clicks gets a
 * fresh one every time, where a URL rendered into the page would be stale by
 * the time anyone pressed it. It also keeps the click a plain link, so no
 * popup blocker gets involved.
 *
 * The signed URL itself never reaches the page's HTML — only the browser that
 * followed the redirect ever sees it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { url } = await api.get<{ url: string }>(
      `/admin/orders/${id}/payment-slip`
    )
    return NextResponse.redirect(url)
  } catch (error) {
    if (error instanceof ApiError) {
      return new NextResponse(error.message, { status: error.status })
    }
    throw error
  }
}
