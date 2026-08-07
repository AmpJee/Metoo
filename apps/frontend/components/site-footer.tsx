import Link from 'next/link'
import { getT } from '@/lib/i18n/server'
import type { MessageKey } from '@/lib/i18n'

/**
 * Footer link groups from the design. These are marketing pages that do not
 * exist yet, so every href points at "/" rather than a 404 — replace the hrefs
 * as those pages get built.
 */
const GROUPS: { title: MessageKey; links: MessageKey[] }[] = [
  {
    title: 'footer.company',
    links: [
      'footer.about',
      'footer.story',
      'footer.careers',
      'footer.newsroom',
      'footer.blog',
    ],
  },
  {
    title: 'footer.explore',
    links: [
      'footer.howItWorks',
      'footer.findNiche',
      'footer.largeRetailers',
      'footer.referBrand',
    ],
  },
  {
    title: 'footer.help',
    links: [
      'footer.helpCenter',
      'footer.contactSeller',
      'footer.sitemap',
      'footer.affiliates',
    ],
  },
  {
    title: 'footer.legal',
    links: [
      'footer.terms',
      'footer.privacy',
      'footer.cookies',
      'footer.ip',
      'footer.accessibility',
    ],
  },
]

export async function SiteFooter() {
  const t = await getT()

  return (
    <footer className="mt-16 border-t border-border">
      <div className="container-page flex flex-wrap gap-[50px] py-12">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">{t(group.title)}</h2>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link}>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {t(link)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page flex flex-col gap-2 border-t border-border py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Metoo</p>
        <p>{t('footer.location')}</p>
      </div>
    </footer>
  )
}
