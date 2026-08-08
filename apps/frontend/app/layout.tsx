import type { Metadata } from 'next'
import { Inter, Noto_Sans_Thai } from 'next/font/google'
import { I18nProvider } from '@/components/i18n-provider'
import { env } from '@/lib/env'
import { getLocale } from '@/lib/i18n/server'
import './globals.css'

// Inter is the design's typeface. next/font self-hosts it, so there is no
// render-blocking request to Google and no layout shift on first paint.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Inter has no Thai glyphs. Without this, every Thai string — including the
// product names already in the catalog — falls back to whatever the device
// happens to have, which on Android is frequently something that does not
// match the rest of the page. Loaded alongside rather than instead of Inter:
// the two are listed together in globals.css, so Latin still renders in Inter
// and only Thai codepoints come from here.
const notoThai = Noto_Sans_Thai({
  subsets: ['thai'],
  variable: '--font-thai',
  display: 'swap',
})

const DESCRIPTION =
  'The best selection of brands for your store, all in one place. ' +
  'Wholesale pricing for independent Thai retailers.'

export const metadata: Metadata = {
  // Absolute base for the share card's image and URL. A chat app fetching
  // the page has no origin to resolve a relative path against, so without
  // this the card points at localhost.
  metadataBase: new URL(env.SITE_URL),
  title: {
    default: 'Metoo — Wholesale marketplace',
    template: '%s · Metoo',
  },
  description: DESCRIPTION,
  // The card itself. app/opengraph-image.tsx supplies the picture; declaring
  // siteName and type here is what makes the preview read as metoo rather
  // than as a bare URL with whatever image the page happened to contain.
  openGraph: {
    type: 'website',
    siteName: 'Metoo',
    title: 'Metoo — Wholesale marketplace',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metoo — Wholesale marketplace',
    description: DESCRIPTION,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Drives the `lang` attribute as well as the copy — screen readers and
  // browser translation both read it, and claiming English on a Thai page is
  // worse than claiming nothing.
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${inter.variable} ${notoThai.variable}`}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  )
}
