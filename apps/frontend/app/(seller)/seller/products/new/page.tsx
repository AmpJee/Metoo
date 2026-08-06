import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/console/card'
import { PageHeader } from '@/components/dashboard-shell'
import { ProductForm } from '../product-form'

export const metadata: Metadata = { title: 'New product' }

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="New Product"
        description="It appears in the catalog as soon as it is visible and in stock."
      />
      <div>
        <Link
          href="/seller/products"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> Products
        </Link>
        <Card>
          <ProductForm />
        </Card>
      </div>
    </>
  )
}
