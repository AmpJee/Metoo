import type { Metadata } from 'next'
import { PortalLogin } from '../portal-login'

export const metadata: Metadata = { title: 'Seller Centre · Log in' }

export default function SellerLoginPage() {
  return <PortalLogin portal="seller" />
}
