'use client'

/**
 * Last-resort error boundary — replaces the root layout when rendering it
 * fails, so it has to supply its own <html> and <body>.
 *
 * Defining it explicitly also keeps the build off Next's built-in
 * /_global-error page, which fails to prerender under Bun.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#717182', margin: '0 0 1.5rem' }}>
            The page could not be loaded. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#cb2957',
              color: '#fff',
              border: 0,
              borderRadius: '0.625rem',
              padding: '0.625rem 1.25rem',
              font: 'inherit',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {/* The digest is what ties this to a server log line. */}
          {error.digest ? (
            <p
              style={{
                color: '#8a8a8a',
                fontSize: '0.75rem',
                marginTop: '1rem',
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  )
}
