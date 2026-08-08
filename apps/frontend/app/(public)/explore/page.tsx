import { redirect } from 'next/navigation'

/**
 * The catalog moved to `/`.
 *
 * Kept as a redirect rather than deleted: /explore is in shared links, in the
 * header's search form action, and in every "browse everything" button that
 * shipped before v2. Preserving the query string matters — a link to
 * /explore?q=Siam is someone's search result.
 */
export default async function ExploreRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value)
  }
  const query = params.toString()
  redirect(query ? `/?${query}` : '/')
}
