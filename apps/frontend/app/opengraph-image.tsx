import { ImageResponse } from 'next/og'
import { LOGO_WORDMARK_DATA_URI } from './logo'

/**
 * The picture a shared link shows.
 *
 * Without one, a chat app scrapes the page and picks the largest image it
 * finds — which on the catalog is whichever product happens to be first.
 * Sharing metoo showed someone else's packaging, and the day the catalog
 * reordered it would show something different.
 *
 * White ground, not the brand pink: the logo is a single-colour pink mark, so
 * on pink it disappears entirely.
 *
 * Applies to every route that does not define its own.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Metoo — Where Local Brands Meet Local Shelves'

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
        gap: 44,
        background: '#ffffff',
      }}
    >
      {/* A plain img, not next/image: this renders inside satori, which has
          no Next runtime and understands only basic elements. */}
      <img src={LOGO_WORDMARK_DATA_URI} width={720} alt="" />
      <div style={{ fontSize: 38, color: '#5b5b5b' }}>
        Where Local Brands Meet Local Shelves.
      </div>
    </div>,
    size
  )
}
