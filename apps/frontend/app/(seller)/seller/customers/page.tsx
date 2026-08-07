import type { ShopType } from '@metoo/shared'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/dashboard-shell'
import { Pill } from '@/components/console/pill'
import { Card, CardEmpty } from '@/components/console/card'
import { StatTile } from '@/components/console/stat-tile'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { api } from '@/lib/api'
import { formatBaht, formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { BrandCustomer } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('customers.title') }
}

export default async function SellerCustomersPage() {
  const t = await getT()
  const locale = await getLocale()
  const customers = await api.get<BrandCustomer[]>('/brand/customers')

  const repeat = customers.filter((customer) => customer.isRepeat).length
  const totalSpent = customers.reduce(
    (sum, customer) => sum + customer.totalSpentMinor,
    0
  )

  return (
    <>
      <PageHeader
        title={t('customers.title')}
        description={t('customers.subtitle')}
      />

      <div className="flex flex-col gap-[20px]">
        <Card>
          {customers.length === 0 ? (
            <CardEmpty
              icon={Users}
              title={t('customers.emptyTitle')}
              description={t('customers.emptyBody')}
            />
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-3">
                <StatTile
                  label={t('customers.count')}
                  value={String(customers.length)}
                />
                <StatTile
                  label={t('customers.repeat')}
                  value={String(repeat)}
                  hint={t('customers.repeatHint', {
                    n: Math.round((repeat / customers.length) * 100),
                  })}
                />
                <StatTile
                  label={t('customers.lifetime')}
                  value={formatBaht(totalSpent)}
                  tint="primary"
                />
              </section>

              <Table>
                <THead>
                  <TR>
                    <TH>{t('customers.shop')}</TH>
                    <TH>{t('customers.location')}</TH>
                    <TH className="text-right">{t('customers.orders')}</TH>
                    <TH className="text-right">{t('customers.totalSpent')}</TH>
                    <TH>{t('customers.lastOrder')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {customers.map((customer) => (
                    <TR key={customer.id}>
                      <TD>
                        <span className="flex items-center gap-2">
                          <span className="font-bold">{customer.shopName}</span>
                          {customer.isRepeat ? (
                            <Pill tone="success">
                              {t('customers.isRepeat')}
                            </Pill>
                          ) : null}
                        </span>
                        <span className="block text-[13px] text-black/50">
                          {customer.shopType
                            ? t(`shopType.${customer.shopType as ShopType}`)
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
                          ? formatDate(customer.lastOrderAt, locale)
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
