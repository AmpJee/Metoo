import type { Metadata } from 'next'
import { PortalLogin } from '../portal-login'

export const metadata: Metadata = { title: 'Console · Log in' }

export default function AdminLoginPage() {
  return <PortalLogin portal="admin" />
}
