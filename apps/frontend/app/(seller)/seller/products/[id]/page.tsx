import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card } from '@/components/console/card'
import { PageHeader } from '@/components/dashboard-shell'
import { ApiError, api } from '@/lib/api'
import type { BrandProduct } from '@/lib/types'
import { PhotoUpload } from '../photo-upload'
import { ProductForm } from '../product-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const product = await api.get<BrandProduct>(`/brand/products/${id}`)
    return { title: product.name }
  } catch {
    return { title: 'Product' }
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let product: BrandProduct
  try {
    product = await api.get<BrandProduct>(`/brand/products/${id}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }

  return (
    <>
      <PageHeader title={product.name} description="Edit this product" />

      <div>
        <Link
          href="/seller/products"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> Products
        </Link>

        <div className="mb-8">
          <PhotoUpload productId={product.id} photoUrl={product.photoUrl} />
        </div>

        <Card>
          <ProductForm product={product} />
        </Card>
      </div>
    </>
  )
}
