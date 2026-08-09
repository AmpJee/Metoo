'use client'

import { Loader2, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { startThread } from '@/app/actions/chat'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { loginHref } from '@/lib/portals'

/**
 * Open the conversation with a brand, from its storefront.
 *
 * The API is idempotent — you get the existing thread back if there is one —
 * so this cannot split a history in two however many times it is pressed. It
 * also means the button reads the same whether or not you have talked to this
 * brand before, which is what a buyer expects: they are not "starting" a
 * thread, they are messaging a shop.
 *
 * A first message goes with it because the API requires one: a thread with no
 * words in it would show the brand an empty conversation and nothing to reply
 * to.
 */
export function ChatWithBrand({ brandId }: { brandId: string }) {
  const t = useT()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await startThread(brandId, t('chat.firstMessage'))
            if (!result.ok) {
              // Only a signed-in, onboarded retailer may open a thread, and
              // the storefront is public — so this is the same "you need an
              // account" moment as Add to Cart, not an error.
              if (result.signInRequired) {
                router.push(loginHref(window.location.pathname))
                return
              }
              setError(result.error)
              return
            }
            router.push(`/chat?t=${result.data.id}`)
          })
        }}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MessageCircle className="size-4" />
        )}
        {t('chat.withBrand')}
      </Button>

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
