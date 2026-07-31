/**
 * Shared TypeBox helpers.
 */
import { t } from 'elysia'

/**
 * An optional enum-valued query parameter.
 *
 * Why this exists: `t.UnionEnum(values)` emits `default: values[0]`, and Elysia
 * applies schema defaults to absent optional query parameters. So a plain
 * `t.Optional(t.UnionEnum(CATEGORIES))` on `?category=` does not mean "no
 * filter" when omitted — it silently means "FOOD_BEVERAGE", and the endpoint
 * quietly returns a filtered subset with no error to explain it.
 *
 * Passing an explicit `default: undefined` suppresses that. Use this for every
 * optional enum filter; never `t.Optional(t.UnionEnum(...))` directly.
 */
export function optionalEnum<const T extends string>(
  // A non-empty readonly tuple, so the literal union survives inference — a
  // plain `readonly string[]` would widen the result to `string`.
  values: readonly [T, ...T[]]
) {
  return t.Optional(t.UnionEnum(values, { default: undefined }))
}
