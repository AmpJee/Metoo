'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { requestWithdrawal } from '@/app/actions/seller'
import { CButton } from '@/components/console/button'
import { CField, CInput } from '@/components/console/field'
import { useT } from '@/components/i18n-provider'
import { formatBaht } from '@/lib/format'

/**
 * Request a payout.
 *
 * The amount is checked here for a fast answer, but the API re-checks the
 * balance inside the same transaction that writes the debit — that, not this
 * form, is what stops two concurrent requests overdrawing the wallet.
 */
export function WithdrawForm({
  availableMinor,
  minWithdrawalMinor,
  bankName,
  bankAccountLast4,
}: {
  availableMinor: number
  minWithdrawalMinor: number
  bankName: string | null
  bankAccountLast4: string | null
}) {
  const router = useRouter()
  const t = useT()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  // Without bank details an admin has nowhere to send the money.
  if (!bankName || !bankAccountLast4) {
    return (
      <p className="rounded-md bg-[#f5f5f5] p-3 text-[15px] text-black/50">
        {t('withdraw.needBank')}
      </p>
    )
  }

  if (availableMinor < minWithdrawalMinor) {
    return (
      <p className="rounded-md bg-[#f5f5f5] p-3 text-[15px] text-black/50">
        {t('withdraw.belowMinimum', {
          amount: formatBaht(minWithdrawalMinor),
        })}
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        setDone(false)

        const baht = Number(new FormData(event.currentTarget).get('amountBaht'))
        const amountMinor = Math.round(baht * 100)

        if (!Number.isFinite(baht) || amountMinor < minWithdrawalMinor) {
          setError(
            t('withdraw.atLeast', {
              amount: formatBaht(minWithdrawalMinor),
            })
          )
          return
        }
        if (amountMinor > availableMinor) {
          setError(t('withdraw.exceedsBalance'))
          return
        }

        startTransition(async () => {
          const result = await requestWithdrawal(amountMinor)
          if (!result.ok) {
            setError(result.error)
            return
          }
          setDone(true)
          router.refresh()
        })
      }}
    >
      <CField
        label={t('withdraw.amount')}
        hint={t('withdraw.amountHint', {
          available: formatBaht(availableMinor),
          minimum: formatBaht(minWithdrawalMinor),
        })}
      >
        <CInput
          name="amountBaht"
          type="number"
          step="0.01"
          min={(minWithdrawalMinor / 100).toFixed(2)}
          max={(availableMinor / 100).toFixed(2)}
          required
        />
      </CField>

      <p className="text-[13px] text-black/50">
        {t('withdraw.payoutNote', {
          bank: bankName,
          last4: bankAccountLast4,
        })}
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-[#d4183d]/10 px-3 py-2 text-[15px] text-[#d4183d]"
        >
          {error}
        </p>
      ) : null}

      {done ? (
        <p className="rounded-md bg-[#1f7a4d]/10 px-3 py-2 text-[15px] text-[#1f7a4d]">
          {t('withdraw.done')}
        </p>
      ) : null}

      <CButton type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {t('withdraw.confirm')}
      </CButton>
    </form>
  )
}
