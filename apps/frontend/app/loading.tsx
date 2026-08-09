import Image from 'next/image'
import styles from './loading.module.css'

/**
 * What fills the page while a route is still fetching.
 *
 * At the app root, so every route that does not define its own gets it — and
 * most of this app's pages are server components that wait on the API, which
 * is exactly the gap this covers.
 *
 * The mark is the asset, not a CSS square that happens to match it. The two
 * render identically today — the mark IS a rounded square — but the day it
 * gains any detail, a file picks that up and a border-radius does not.
 *
 * The wordmark below it stays text rather than `logo-wordmark.svg`, because
 * the design's lockup is a black lowercase "metoo." UNDER the mark, where
 * that asset is an all-pink uppercase lockup set BESIDE it.
 *
 * `aria-busy` with a label, because a screen reader gets nothing from a pink
 * square: without it the page simply goes quiet until the content lands.
 */
export default function Loading() {
  return (
    <div className={styles.screen} role="status" aria-busy="true">
      <Image
        src="/logo-mark.svg"
        alt=""
        width={96}
        height={96}
        className={styles.mark}
        priority
      />
      <p className={styles.wordmark}>metoo.</p>
      <span className="sr-only">Loading</span>
    </div>
  )
}
