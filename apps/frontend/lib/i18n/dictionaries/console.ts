/**
 * The seller and admin consoles.
 *
 * Kept apart from `shop.ts` for the same reason `components/console/` is kept
 * apart from `components/ui/`: the two surfaces describe the same rows in
 * different words, and a shared key would force one of them to be wrong. An
 * order is "รอชำระเงิน" to the shopkeeper who owes the money and
 * "ออร์เดอร์ใหม่" to the brand who has to pack it.
 *
 * Filled in by tiers 3 and 4.
 */

export const en = {} as const

export type Dict = typeof en

export const th: Record<keyof Dict, string> = {}
