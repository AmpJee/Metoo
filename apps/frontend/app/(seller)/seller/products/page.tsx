import { CATEGORY_LABELS } from '@metoo/shared'
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
import type { BrandProduct } from '@/lib/types'

export const metadata: Metadata = { title: 'Products' }

export default async function SellerProductsPage() {
  const products = await api.get<BrandProduct[]>('/brand/products')
  const active = products.filter((product) => product.isActive).length

  return (
    <>
      <PageHeader
        title={`My Products (${products.length})`}
        description={`${active} visible in the catalog`}
        actions={
          <CButton asChild>
            <Link href="/seller/products/new">
              <Plus className="size-[18px]" /> New Product
            </Link>
          </CButton>
        }
      />

      <Card>
        {products.length === 0 ? (
          <CardEmpty
            icon={Package}
            title="No products yet"
            description="List your first product to start selling."
            action={{ label: 'New Product', href: '/seller/products/new' }}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Product</TH>
                <TH>Category</TH>
                <TH className="text-right">Price / pack</TH>
                <TH className="text-right">MOQ</TH>
                <TH className="text-right">Stock</TH>
                <TH>Status</TH>
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
                    {CATEGORY_LABELS[product.category]}
                  </TD>
                  <TD numeric>{formatBaht(product.pricePerPackMinor)}</TD>
                  <TD numeric>{product.minPacks}</TD>
                  <TD numeric>
                    {product.stockPacks === null ? (
                      <span className="text-black/50">To order</span>
                    ) : (
                      product.stockPacks
                    )}
                  </TD>
                  <TD>
                    {/* Three states, not two: a product can be listed but out
                        of stock, which is different from being hidden. */}
                    {!product.isActive ? (
                      <Pill>Hidden</Pill>
                    ) : product.stockPacks === 0 ? (
                      <Pill tone="warning">Out of stock</Pill>
                    ) : (
                      <Pill tone="success">Active</Pill>
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
