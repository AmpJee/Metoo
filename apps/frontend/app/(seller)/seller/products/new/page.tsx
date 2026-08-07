import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/console/card'
import { PageHeader } from '@/components/dashboard-shell'
import { getT } from '@/lib/i18n/server'
import { ProductForm } from '../product-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('productForm.newTitle') }
}

export default async function NewProductPage() {
  const t = await getT()

  return (
    <>
      <PageHeader
        title={t('productForm.newTitle')}
        description={t('productForm.newSubtitle')}
      />
      <div>
        <Link
          href="/seller/products"
          className="mb-6 inline-flex items-center gap-1 text-[15px] text-black/50 hover:text-[#cb2957]"
        >
          <ArrowLeft className="size-4" /> {t('productForm.backToProducts')}
        </Link>
        <Card>
          <ProductForm />
        </Card>
      </div>
    </>
  )
}
