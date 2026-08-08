import type { Metadata } from 'next'
import { ArrowRight, Store } from 'lucide-react'
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
        <div className="flex flex-col gap-4 text-muted-foreground">
          <p>
            {t('signup.retailer.haveAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.login')}
            </Link>
          </p>

          {/* Same block as the shop's sign-in. A brand that signs up on this
              form ends up with an account it cannot use here, so the other
              door belongs in front of them, not in a footnote. */}
          <Link
            href="/register/seller"
            className="flex items-center gap-3 rounded-[9px] border border-border p-4 transition-colors hover:border-primary"
          >
            <Store className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
            <span className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">
                {t('signup.retailer.areYouBrand')}
              </span>
              <span className="text-xs">{t('auth.brandSignupHint')}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-primary" />
          </Link>
        </div>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
