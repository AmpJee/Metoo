/**
 * Shared TypeBox helpers.
 */
import { t } from 'elysia'

/**
 * A warning that applies to every schema in this codebase, not just enums:
 *
 * **Elysia applies a TypeBox `default` to an ABSENT property.** That is fine
 * on a POST and wrong on a PATCH, where absent means "leave it alone" — and
 * `t.Partial` preserves defaults, so a shared body schema carries them into
 * the update route. `minPacks: t.Integer({ default: 1 })` on the product body
 * meant renaming a product silently reset its minimum order to 1.
 *
 * Never put `default` on a body field that a PATCH also uses. Let the database
 * column default handle creation, where it cannot leak into an update.
 */

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

/**
 * Where to reach an account, and where to ship.
 *
 * Registration writes these and the profile screens edit them, so the bounds
 * live here rather than in either module. If they were declared twice, one copy
 * would eventually accept an address the other rejects, and which one you hit
 * would depend on whether you were signing up or correcting a typo.
 */
export const CONTACT_FIELDS = {
  phone: t.String({ minLength: 6, maxLength: 20 }),
  addressLine: t.String({ minLength: 1, maxLength: 200 }),
  province: t.String({ minLength: 1, maxLength: 100 }),
  postalCode: t.String({ minLength: 4, maxLength: 10 }),
} as const
