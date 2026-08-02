import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter is the design's typeface. next/font self-hosts it, so there is no
// render-blocking request to Google and no layout shift on first paint.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Metoo — Wholesale marketplace',
    template: '%s · Metoo',
  },
  description:
    'The best selection of brands for your store, all in one place. ' +
    'Wholesale pricing for independent Thai retailers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
