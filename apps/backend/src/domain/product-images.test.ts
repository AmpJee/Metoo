import { describe, expect, test } from 'bun:test'
import {
  coverUrl,
  planReorder,
  positionsAfterRemoval,
} from './product-images.ts'

describe('planReorder', () => {
  test('assigns positions in the order given', () => {
    const result = planReorder(['a', 'b', 'c'], ['c', 'a', 'b'])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect([...result.positions]).toEqual([
      ['c', 0],
      ['a', 1],
      ['b', 2],
    ])
  })

  test('rejects a partial list rather than guessing', () => {
    // "these first, rest after" and "delete the others" are both plausible
    // readings, and guessing wrong silently loses a photo.
    expect(planReorder(['a', 'b', 'c'], ['a', 'b'])).toMatchObject({
      ok: false,
      code: 'REORDER_NOT_A_PERMUTATION',
    })
  })

  test('rejects an unknown id', () => {
    expect(planReorder(['a', 'b'], ['a', 'zzz'])).toMatchObject({
      ok: false,
      code: 'REORDER_NOT_A_PERMUTATION',
    })
  })

  test('rejects a duplicate, even at the right length', () => {
    expect(planReorder(['a', 'b'], ['a', 'a'])).toMatchObject({
      ok: false,
      code: 'REORDER_NOT_A_PERMUTATION',
    })
  })

  test('rejects an empty list', () => {
    expect(planReorder(['a'], [])).toMatchObject({
      ok: false,
      code: 'REORDER_EMPTY',
    })
  })

  test('an unchanged order is valid', () => {
    const result = planReorder(['a', 'b'], ['a', 'b'])
    expect(result.ok).toBe(true)
  })
})

describe('coverUrl', () => {
  test('takes the lowest position, not the first array element', () => {
    // Product.photoUrl is a copy of this. If it disagreed with the gallery the
    // wrong picture would show on every card in the catalog.
    expect(
      coverUrl([
        { url: 'second.jpg', position: 1 },
        { url: 'first.jpg', position: 0 },
      ])
    ).toBe('first.jpg')
  })

  test('is null when there are no images', () => {
    expect(coverUrl([])).toBeNull()
  })
})

describe('positionsAfterRemoval', () => {
  test('closes the gap left behind', () => {
    const result = positionsAfterRemoval(
      [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
        { id: 'c', position: 2 },
      ],
      'b'
    )
    expect([...result]).toEqual([
      ['a', 0],
      ['c', 1],
    ])
  })

  test('removing the cover promotes the next image', () => {
    const result = positionsAfterRemoval(
      [
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
      ],
      'a'
    )
    expect(result.get('b')).toBe(0)
  })

  test('sorts before renumbering, so unsorted input is still correct', () => {
    const result = positionsAfterRemoval(
      [
        { id: 'c', position: 2 },
        { id: 'a', position: 0 },
        { id: 'b', position: 1 },
      ],
      'a'
    )
    expect([...result]).toEqual([
      ['b', 0],
      ['c', 1],
    ])
  })

  test('removing the only image leaves nothing', () => {
    expect([...positionsAfterRemoval([{ id: 'a', position: 0 }], 'a')]).toEqual(
      []
    )
  })
})
