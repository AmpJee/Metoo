/**
 * Product image ordering — pure, no Prisma, no I/O.
 *
 * Images are an ordered list, not a set: the first one is the cover, shown on
 * every product card, in the cart and on every order row. So "which image is
 * first" is a business fact, not a rendering detail, and the rules for
 * changing it belong here where they can be tested without a database.
 */

/** Enough for a product page's thumbnail strip without it wrapping badly. */
export const MAX_PRODUCT_IMAGES = 8

export type ReorderCheck =
  | { ok: true; positions: Map<string, number> }
  | { ok: false; code: 'REORDER_NOT_A_PERMUTATION' | 'REORDER_EMPTY' }

/**
 * Work out each image's new position from the order the client sent.
 *
 * The desired list must be exactly the current set, rearranged — same ids, no
 * additions, no omissions, no duplicates. A partial list is rejected rather
 * than interpreted, because there is no single obvious meaning for it: it
 * could mean "these first, rest after" or "delete the others", and guessing
 * wrong silently loses a photo.
 */
export function planReorder(
  currentIds: readonly string[],
  desiredIds: readonly string[]
): ReorderCheck {
  if (desiredIds.length === 0) return { ok: false, code: 'REORDER_EMPTY' }

  if (desiredIds.length !== currentIds.length) {
    return { ok: false, code: 'REORDER_NOT_A_PERMUTATION' }
  }

  const current = new Set(currentIds)
  const seen = new Set<string>()

  for (const id of desiredIds) {
    // Catches both an unknown id and a duplicate, which are the same mistake
    // from the caller's point of view: the list is not the set it should be.
    if (!current.has(id) || seen.has(id)) {
      return { ok: false, code: 'REORDER_NOT_A_PERMUTATION' }
    }
    seen.add(id)
  }

  return {
    ok: true,
    positions: new Map(desiredIds.map((id, index) => [id, index])),
  }
}

/**
 * The cover URL for a list of images, or null when there are none.
 *
 * Takes the lowest position rather than assuming the list arrives sorted —
 * `Product.photoUrl` is a denormalised copy of this, and a cover that
 * disagreed with the gallery would be visible on every card in the catalog.
 */
export function coverUrl(
  images: readonly { url: string; position: number }[]
): string | null {
  if (images.length === 0) return null

  return images.reduce((lowest, image) =>
    image.position < lowest.position ? image : lowest
  ).url
}

/**
 * Positions after removing one image: the survivors keep their order and close
 * the gap. Leaving a hole would work, but positions then drift upward with
 * every delete until they are meaningless as an index.
 */
export function positionsAfterRemoval(
  images: readonly { id: string; position: number }[],
  removedId: string
): Map<string, number> {
  const remaining = images
    .filter((image) => image.id !== removedId)
    .sort((a, b) => a.position - b.position)

  return new Map(remaining.map((image, index) => [image.id, index]))
}
