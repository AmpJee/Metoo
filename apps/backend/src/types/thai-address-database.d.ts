/**
 * Types for `thai-address-database`, which ships none.
 *
 * Only the one function we call is declared. The package also exports
 * searchAddressByDistrict, searchAddressByAmphoe, searchAddressByZipcode and
 * splitAddress; leaving them undeclared is deliberate, so reaching for one
 * later is a decision someone makes on purpose rather than a call that
 * silently compiles as `any`.
 *
 * The field names are the package's own and are one level off from ours —
 * `district` is the sub-district, `amphoe` is the district. `src/domain/
 * address.ts` is where that gets straightened out.
 */
declare module 'thai-address-database' {
  interface ThaiAddressRow {
    /** Sub-district — แขวง / ตำบล. */
    district: string
    /** District — เขต / อำเภอ. */
    amphoe: string
    province: string
    zipcode: number
  }

  /** Prefix match on the province name, capped at `limit` rows. */
  export function searchAddressByProvince(
    province: string,
    limit?: number
  ): ThaiAddressRow[]
}
