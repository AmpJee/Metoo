import type { Metadata } from 'next'
import { getT } from '@/lib/i18n/server'
import { PortalLogin } from './portal-login'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('auth.login') }
}

export default function LoginPage() {
  return <PortalLogin portal="retailer" />
}
