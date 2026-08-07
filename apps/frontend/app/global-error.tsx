'use client'

/**
 * Last-resort error boundary — replaces the root layout when rendering it
 * fails, so it has to supply its own <html> and <body>.
 *
 * Defining it explicitly also keeps the build off Next's built-in
 * /_global-error page, which fails to prerender under Bun.
 *
 * The one screen in the app that cannot be translated: it renders when the
 * root layout has failed, which is exactly what provides the locale, so
 * there is nothing to read the reader's language from. It says both instead
 * — the audience is Thai and this is the worst possible moment to show
 * someone a language they do not read.
 *
 * Fonts are named literally rather than through the CSS variables the rest of
 * the app uses, for the same reason: the layout that defines them is gone.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="th">
      <body
        style={{
          fontFamily:
            '"Noto Sans Thai", "Inter", ui-sans-serif, system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          margin: 0,
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>
            เกิดข้อผิดพลาด
          </h1>
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 400,
              color: '#717182',
              margin: '0 0 0.75rem',
            }}
          >
            Something went wrong
          </h2>
          <p style={{ color: '#717182', margin: '0 0 1.5rem' }}>
            ไม่สามารถโหลดหน้านี้ได้ กรุณาลองใหม่อีกครั้ง
            <br />
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
            ลองใหม่ · Try again
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
              รหัสอ้างอิง / Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  )
}
