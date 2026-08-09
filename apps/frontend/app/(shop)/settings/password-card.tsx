'use client'

import { useState } from 'react'
import { AccountCard, CardAction } from '@/components/account/card'
import { ChangePasswordForm } from '@/components/change-password-form'
import { useT } from '@/components/i18n-provider'

/**
 * Password, collapsed until asked for.
 *
 * Three password boxes sitting open on a settings page is an invitation to
 * nothing — nobody arrives here to change a password by accident, and the
 * fields push everything below them off the screen. Closed, the card still
 * says what it is for.
 *
 * The form itself is shared with the seller console, which shows it open;
 * only the disclosure lives here.
 */
export function PasswordCard() {
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <AccountCard
      title={t('password.title')}
      action={
        <CardAction onClick={() => setOpen((o) => !o)}>
          {open ? t('common.cancel') : t('settings.changePassword')}
        </CardAction>
      }
    >
      {open ? (
        <ChangePasswordForm onSaved={() => setOpen(false)} />
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[18px] tracking-[0.2em] text-black/40">
            {t('settings.passwordHidden')}
          </p>
          <p className="text-[15px] text-black/45">{t('password.subtitle')}</p>
        </div>
      )}
    </AccountCard>
  )
}
