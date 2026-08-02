import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth-shell'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Log in' }

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to browse wholesale pricing and place orders."
      footer={
        <p className="text-muted-foreground">
          New to Metoo?{' '}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Sign up to buy
          </Link>
        </p>
      }
    >
      {/* useSearchParams needs a Suspense boundary to keep the page static. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
