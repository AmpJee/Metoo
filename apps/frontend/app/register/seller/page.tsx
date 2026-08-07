import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { getT } from '@/lib/i18n/server'
import { PORTALS } from '@/lib/portals'
import { SellerRegisterForm } from './seller-register-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('signup.brand.title') }
}

export default async function SellerRegisterPage() {
  const t = await getT()

  return (
    <AuthShell
      title={t('signup.brand.title')}
      subtitle={t('signup.brand.subtitle')}
      footer={
        <div className="flex flex-col gap-2 text-muted-foreground">
          <p>
            {t('signup.brand.alreadySelling')}{' '}
            <Link
              href={PORTALS.seller.loginPath}
              className="font-medium text-primary hover:underline"
            >
              {t('signup.brand.sellerLogin')}
            </Link>
          </p>
          <p>
            {t('signup.brand.buyingInstead')}{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              {t('landing.signUpToBuy')}
            </Link>
          </p>
        </div>
      }
    >
      <SellerRegisterForm />
    </AuthShell>
  )
}
