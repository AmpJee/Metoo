import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth-shell'
import { RegisterForm } from './register-form'

export const metadata: Metadata = { title: 'Sign up' }

export default function RegisterPage() {
  return (
    <AuthShell
      title="Sign up to buy"
      subtitle="Welcome! Create your account to unlock wholesale pricing."
      footer={
        <div className="flex flex-col gap-2 text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
          <p>
            Are you a brand?{' '}
            <Link
              href="/register/seller"
              className="font-medium text-primary hover:underline"
            >
              Sell on Metoo
            </Link>
          </p>
        </div>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
