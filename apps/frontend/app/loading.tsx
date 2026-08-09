import styles from './loading.module.css'

/**
 * What fills the page while a route is still fetching.
 *
 * At the app root, so every route that does not define its own gets it — and
 * most of this app's pages are server components that wait on the API, which
 * is exactly the gap this covers.
 *
 * The mark is drawn rather than pulled from `public/logo-wordmark.svg`: the
 * design puts a black lowercase "metoo." under a tilted square, where the
 * asset is an all-pink uppercase lockup. Different lockup, so it is built
 * from the same two colour variables instead of being a second copy of the
 * file that would drift from it.
 *
 * `aria-busy` with a label, because a screen reader gets nothing from a pink
 * square: without it the page simply goes quiet until the content lands.
 */
export default function Loading() {
  return (
    <div className={styles.screen} role="status" aria-busy="true">
      <div className={styles.mark} aria-hidden />
      <p className={styles.wordmark}>metoo.</p>
      <span className="sr-only">Loading</span>
    </div>
  )
}
