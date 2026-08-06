import Link from 'next/link'

/**
 * Footer link groups from the design. These are marketing pages that do not
 * exist yet, so every href points at "/" rather than a 404 — replace the hrefs
 * as those pages get built.
 */
const GROUPS = [
  {
    title: 'Company',
    links: ['About us', 'Our Story', 'Careers', 'Newsroom', 'Blog'],
  },
  {
    title: 'Explore',
    links: [
      'How metoo works',
      'Find Your Niche',
      'Large retailers',
      'Refer a brand',
    ],
  },
  {
    title: 'Help',
    links: ['Help center', 'Contact Seller', 'Sitemap', 'Affiliates'],
  },
  {
    title: 'Legal',
    links: [
      'Terms of Service',
      'Privacy Policy',
      'Cookie Policy',
      'IP Policy',
      'Accessibility Policy',
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="container-page flex flex-wrap gap-[50px] py-12">
        {GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link}>
                  <Link
                    href="/"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container-page flex flex-col gap-2 border-t border-border py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Metoo</p>
        <p>Bangkok, Thailand</p>
      </div>
    </footer>
  )
}
