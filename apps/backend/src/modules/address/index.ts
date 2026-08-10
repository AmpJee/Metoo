/**
 * Thai address reference data.
 *
 * Public, like `GET /catalog/*` and for the same kind of reason: it is a list
 * of place names, it carries nothing about anybody, and the signup form needs
 * it before there is a session to check. Putting a guard here would only mean
 * a new retailer cannot pick their own district.
 *
 * One province per request. The whole cascade — district, then sub-district,
 * then the postcode filling itself in — runs client-side off that response,
 * so choosing a sub-district never waits on the network.
 */
import { Elysia, t } from 'elysia'
import { districtsFor } from '../../domain/address.ts'

export const addressModule = new Elysia({
  name: 'address',
  prefix: '/address',
}).get(
  '/districts',
  ({ query }) => ({ districts: districtsFor(query.province) }),
  {
    query: t.Object({
      province: t.String({ minLength: 1, maxLength: 100 }),
    }),
    detail: {
      summary: 'Districts and sub-districts for a province',
      description:
        'Thai administrative areas one province at a time, each sub-district ' +
        'with its postal code. An unknown province name returns an empty ' +
        'list rather than a 404 — the caller is filling in a form, and an ' +
        'error is not more useful to them than no options.',
      tags: ['Address'],
    },
    response: t.Object({
      districts: t.Array(
        t.Object({
          name: t.String(),
          // Both names travel, so an English-locale form does not have to
          // show Thai in its dropdowns or translate on the client.
          nameEn: t.String(),
          subDistricts: t.Array(
            t.Object({
              name: t.String(),
              nameEn: t.String(),
              postalCode: t.String(),
            })
          ),
        })
      ),
    }),
  }
)
