import type { Metadata } from 'next'
import { PortalLogin } from './portal-login'

export const metadata: Metadata = { title: 'Log in' }

export default function LoginPage() {
  return <PortalLogin portal="retailer" />
}
