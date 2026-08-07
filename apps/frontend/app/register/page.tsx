import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { getT } from '@/lib/i18n/server'
import { RegisterForm } from './register-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('signup.retailer.title') }
}

export default async function RegisterPage() {
  const t = await getT()

  return (
    <AuthShell
      title={t('signup.retailer.title')}
      subtitle={t('signup.retailer.subtitle')}
      footer={
        <div className="flex flex-col gap-2 text-muted-foreground">
          <p>
            {t('signup.retailer.haveAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.login')}
            </Link>
          </p>
          <p>
            {t('signup.retailer.areYouBrand')}{' '}
            <Link
              href="/register/seller"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.sellOnMetoo')}
            </Link>
          </p>
        </div>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
