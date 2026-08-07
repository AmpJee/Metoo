import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { PORTALS } from '@/lib/portals'
import { SellerRegisterForm } from './seller-register-form'

export const metadata: Metadata = { title: 'Sell on Metoo' }

export default function SellerRegisterPage() {
  return (
    <AuthShell
      title="Sell on Metoo"
      subtitle="Create your brand account. We will be in touch to walk you through onboarding."
      footer={
        <div className="flex flex-col gap-2 text-muted-foreground">
          <p>
            Already selling with us?{' '}
            <Link
              href={PORTALS.seller.loginPath}
              className="font-medium text-primary hover:underline"
            >
              Seller Centre log in
            </Link>
          </p>
          <p>
            Looking to buy instead?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Sign up to buy
            </Link>
          </p>
        </div>
      }
    >
      <SellerRegisterForm />
    </AuthShell>
  )
}
