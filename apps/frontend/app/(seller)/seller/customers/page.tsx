import { SHOP_TYPE_LABELS, type ShopType } from '@metoo/shared'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { StatTile } from '@/components/console/stat-tile'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import type { BrandCustomer } from '@/lib/types'

export const metadata: Metadata = { title: 'Customers' }

export default async function SellerCustomersPage() {
  const customers = await api.get<BrandCustomer[]>('/brand/customers')

  const repeat = customers.filter((customer) => customer.isRepeat).length
  const totalSpent = customers.reduce(
    (sum, customer) => sum + customer.totalSpentMinor,
    0
  )

  return (
    <>
      <PageHeader
        title="Customers"
        description="Every shop that has ordered from you."
      />

      <div className="flex flex-col gap-[20px]">
        <Card>
          {customers.length === 0 ? (
            <CardEmpty
              icon={Users}
              title="No customers yet"
              description="Shops appear here once they place their first order."
            />
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <StatTile label="Customers" value={String(customers.length)} />
                <StatTile
                  label="Repeat customers"
                  value={String(repeat)}
                  hint={`${Math.round((repeat / customers.length) * 100)}% of the total`}
                />
                <StatTile
                  label="Lifetime revenue"
                  value={formatBaht(totalSpent)}
                  tint="primary"
                />
              </section>

              <Table>
                <THead>
                  <TR>
                    <TH>Shop</TH>
                    <TH>Location</TH>
                    <TH className="text-right">Orders</TH>
                    <TH className="text-right">Total spent</TH>
                    <TH>Last order</TH>
                  </TR>
                </THead>
                <TBody>
                  {customers.map((customer) => (
                    <TR key={customer.id}>
                      <TD>
                        <span className="flex items-center gap-2">
                          <span className="font-bold">{customer.shopName}</span>
                          {customer.isRepeat ? (
                            <Pill tone="success">Repeat</Pill>
                          ) : null}
                        </span>
                        <span className="block text-[13px] text-black/50">
                          {customer.shopType
                            ? SHOP_TYPE_LABELS[customer.shopType as ShopType]
                            : '—'}{' '}
                          · {customer.phone}
                        </span>
                      </TD>
                      <TD className="text-black/50">
                        {customer.province}
                        {customer.zone ? (
                          <span className="block text-[13px]">
                            {customer.zone}
                          </span>
                        ) : null}
                      </TD>
                      <TD numeric>{customer.orderCount}</TD>
                      <TD numeric>{formatBaht(customer.totalSpentMinor)}</TD>
                      <TD className="whitespace-nowrap text-black/50">
                        {customer.lastOrderAt
                          ? formatDate(customer.lastOrderAt)
                          : '—'}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
