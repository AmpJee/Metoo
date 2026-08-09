'use client'

import { SHOP_TYPES } from '@metoo/shared'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateRetailerProfile } from '@/app/actions/account'
import { Field } from '@/components/auth-shell'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { RetailerProfile } from '@/lib/types'

const SELECT_CLASS =
  'flex h-10 w-full rounded-lg bg-input px-3 text-sm disabled:opacity-50'

/**
 * How the shop operates — the six answers Metoo needs before it can deliver.
 *
 * Required rather than optional, and enforced by the API at checkout: zone
 * and delivery window decide whether a courier run is possible at all, so
 * collecting them after the first order means discovering the order cannot be
 * delivered. The same six are the columns the admin console shows.
 *
 * Payment reliability is deliberately not here — that is a track record admin
 * keeps from experience, not something a shop declares about itself.
 */
export function ShopOperationsForm({ profile }: { profile: RetailerProfile }) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  const missing = new Set(profile.missingForCheckout.map((m) => m.field))

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const capacity = Number(data.get('monthlyCapacity'))

    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await updateRetailerProfile(
        {
          shopType: String(data.get('shopType')) as RetailerProfile['shopType'],
          zone: String(data.get('zone') ?? '').trim(),
          currentProducts: String(data.get('currentProducts') ?? '').trim(),
          monthlyCapacity: Number.isFinite(capacity) ? capacity : undefined,
          deliveryWindow: String(data.get('deliveryWindow') ?? '').trim(),
        },
        {
          shopType: profile.shopType,
          zone: profile.zone,
          currentProducts: profile.currentProducts,
          monthlyCapacity: profile.monthlyCapacity,
          preferredPayment: profile.preferredPayment,
          deliveryWindow: profile.deliveryWindow,
        }
      )

      if (!result.ok) {
        setError(result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-[560px] flex-col gap-4">
      {missing.size > 0 ? (
        <p
          role="status"
          className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning-foreground"
        >
          {t('shopOps.stillNeeded', {
            fields: profile.missingForCheckout.map((m) => m.label).join(', '),
          })}
        </p>
      ) : null}

      <Field label={t('shopOps.shopType')}>
        <select
          name="shopType"
          required
          defaultValue={profile.shopType ?? ''}
          className={SELECT_CLASS}
        >
          <option value="" disabled>
            {t('shopOps.chooseOne')}
          </option>
          {SHOP_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`shopType.${type}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('shopOps.zone')}>
        <Input
          name="zone"
          required
          maxLength={200}
          defaultValue={profile.zone ?? ''}
          placeholder={t('shopOps.zonePlaceholder')}
        />
      </Field>

      <Field label={t('shopOps.currentProducts')}>
        <textarea
          name="currentProducts"
          required
          rows={2}
          maxLength={500}
          defaultValue={profile.currentProducts ?? ''}
          placeholder={t('shopOps.currentProductsPlaceholder')}
          className="w-full rounded-lg bg-input px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
      </Field>

      <Field label={t('shopOps.capacity')}>
        <Input
          name="monthlyCapacity"
          type="number"
          min={1}
          required
          defaultValue={profile.monthlyCapacity ?? ''}
          placeholder={t('shopOps.capacityPlaceholder')}
        />
      </Field>

      <Field label={t('shopOps.deliveryWindow')}>
        <Input
          name="deliveryWindow"
          required
          maxLength={100}
          defaultValue={profile.deliveryWindow ?? ''}
          placeholder={t('shopOps.deliveryWindowPlaceholder')}
        />
      </Field>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {saved ? (
        <p
          role="status"
          className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
        >
          {t('common.saved')}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        {t('shopOps.save')}
      </Button>
    </form>
  )
}
