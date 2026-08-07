import { Package, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CButton } from '@/components/console/button'
import { Card, CardEmpty } from '@/components/console/card'
import { Pill } from '@/components/console/pill'
import { Table, TBody, TD, TH, THead, TR } from '@/components/console/table'
import { PageHeader } from '@/components/dashboard-shell'
import { api } from '@/lib/api'
import { formatBaht } from '@/lib/format'
import { getT } from '@/lib/i18n/server'
import type { BrandProduct } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('nav.seller.products') }
}

export default async function SellerProductsPage() {
  const t = await getT()
  const products = await api.get<BrandProduct[]>('/brand/products')
  const active = products.filter((product) => product.isActive).length

  return (
    <>
      <PageHeader
        title={t('sellerProducts.title', { n: products.length })}
        description={t('sellerProducts.subtitle', { n: active })}
        actions={
          <CButton asChild>
            <Link href="/seller/products/new">
              <Plus className="size-[18px]" /> {t('sellerProducts.new')}
            </Link>
          </CButton>
        }
      />

      <Card>
        {products.length === 0 ? (
          <CardEmpty
            icon={Package}
            title={t('sellerProducts.emptyTitle')}
            description={t('sellerProducts.emptyBody')}
            action={{
              label: t('sellerProducts.new'),
              href: '/seller/products/new',
            }}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('sellerProducts.product')}</TH>
                <TH>{t('sellerProducts.category')}</TH>
                <TH className="text-right">
                  {t('sellerProducts.pricePerPack')}
                </TH>
                <TH className="text-right">{t('sellerProducts.moq')}</TH>
                <TH className="text-right">{t('sellerProducts.stock')}</TH>
                <TH>{t('sellerProducts.status')}</TH>
              </TR>
            </THead>
            <TBody>
              {products.map((product) => (
                <TR key={product.id}>
                  <TD>
                    <Link
                      href={`/seller/products/${product.id}`}
                      className="flex items-center gap-[12px] hover:text-[#cb2957]"
                    >
                      <span className="relative size-[44px] shrink-0 overflow-hidden rounded-[8px] bg-[#f5f5f5]">
                        {product.photoUrl ? (
                          <Image
                            src={product.photoUrl}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="font-bold">{product.name}</span>
                    </Link>
                  </TD>
                  <TD className="text-black/50">
                    {t(`category.${product.category}`)}
                  </TD>
                  <TD numeric>{formatBaht(product.pricePerPackMinor)}</TD>
                  <TD numeric>{product.minPacks}</TD>
                  <TD numeric>
                    {product.stockPacks === null ? (
                      <span className="text-black/50">
                        {t('sellerProducts.toOrder')}
                      </span>
                    ) : (
                      product.stockPacks
                    )}
                  </TD>
                  <TD>
                    {/* Three states, not two: a product can be listed but out
                        of stock, which is different from being hidden. */}
                    {!product.isActive ? (
                      <Pill>{t('sellerProducts.hidden')}</Pill>
                    ) : product.stockPacks === 0 ? (
                      <Pill tone="warning">
                        {t('sellerProducts.outOfStock')}
                      </Pill>
                    ) : (
                      <Pill tone="success">{t('sellerProducts.active')}</Pill>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  )
}
