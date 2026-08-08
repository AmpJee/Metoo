import { ImageResponse } from 'next/og'

/**
 * The picture a shared link shows.
 *
 * Without one, a chat app scrapes the page and picks the largest image it
 * finds — which on the catalog is whichever product happens to be first.
 * Sharing metoo showed someone else's packaging, and the day the catalog
 * reorders it shows something different.
 *
 * Drawn here rather than shipped as a PNG so the wordmark and the brand
 * colour stay in one place: this is the same #cb2957 the header uses, and
 * changing it once changes both.
 *
 * Applies to every route that does not define its own — see the note in
 * app/(public)/products/[id] about product pages deliberately keeping this
 * one rather than showing the product.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Metoo — wholesale marketplace for Thai brands and shops'

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        background: '#cb2957',
        color: '#ffffff',
      }}
    >
      <div style={{ fontSize: 172, fontWeight: 700, letterSpacing: -6 }}>
        metoo
      </div>
      <div style={{ fontSize: 40, opacity: 0.92 }}>
        Wholesale marketplace for Thai brands and shops
      </div>
    </div>,
    size
  )
}
