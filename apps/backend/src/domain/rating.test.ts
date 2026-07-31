import { describe, expect, test } from 'bun:test'
import { checkRating, summarise, summariseTotals } from './rating.ts'

describe('checkRating', () => {
  test('accepts every whole star in range', () => {
    for (const stars of [1, 2, 3, 4, 5]) {
      expect(checkRating(stars)).toEqual({ ok: true })
    }
  })

  test('rejects out of range', () => {
    for (const bad of [0, 6, -1, 100]) {
      expect(checkRating(bad)).toMatchObject({
        ok: false,
        code: 'RATING_OUT_OF_RANGE',
      })
    }
  })

  test('rejects half stars', () => {
    // The UI offers whole stars; accepting 4.5 would make averages
    // irreproducible from the rows.
    expect(checkRating(4.5)).toMatchObject({
      ok: false,
      code: 'INVALID_RATING',
    })
  })
})

describe('summarise', () => {
  test('averages to one decimal, as the design shows', () => {
    // 4.8 is the store rating on the seller dashboard.
    expect(summarise([5, 5, 5, 5, 4])).toEqual({ average: 4.8, count: 5 })
  })

  test('rounds to one decimal rather than carrying float noise', () => {
    // 14 / 3 = 4.666...
    expect(summarise([5, 5, 4])).toEqual({ average: 4.7, count: 3 })
  })

  test('a single review is its own average', () => {
    expect(summarise([3])).toEqual({ average: 3, count: 1 })
  })

  test('no reviews gives null, not zero', () => {
    // Zero would sort an unrated product below a badly rated one and render
    // as an empty row of stars, reading as "bad" rather than "not rated yet".
    expect(summarise([])).toEqual({ average: null, count: 0 })
  })

  test('all one-star is honestly 1, not null', () => {
    expect(summarise([1, 1, 1])).toEqual({ average: 1, count: 3 })
  })
})

describe('summariseTotals', () => {
  test('matches summarise for the same data', () => {
    // Listing screens aggregate in SQL and detail screens load rows; the two
    // must never disagree about what an average is.
    const ratings = [5, 5, 4, 3]
    const sum = ratings.reduce((a, b) => a + b, 0)
    expect(summariseTotals(sum, ratings.length)).toEqual(summarise(ratings))
  })

  test('agrees on a value that rounds up', () => {
    expect(summariseTotals(19, 4)).toEqual(summarise([5, 5, 5, 4])) // 4.75
  })

  test('a zero count is null regardless of sum', () => {
    expect(summariseTotals(null, 0)).toEqual({ average: null, count: 0 })
    expect(summariseTotals(0, 0)).toEqual({ average: null, count: 0 })
  })
})
