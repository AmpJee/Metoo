'use client'

import { Check, Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toggleFollow } from '@/app/actions/follow'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'
import { loginHref } from '@/lib/sign-in-required'

export function FollowButton({
  brandId,
  initialFollowing,
  initialCount,
}: {
  brandId: string
  initialFollowing: boolean
  initialCount: number
}) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={following ? 'outline' : 'default'}
        disabled={pending}
        onClick={() => {
          const previous = following
          // Optimistic, with the count moving too — reverted on failure.
          setFollowing(!previous)
          setCount((n) => n + (previous ? -1 : 1))
          startTransition(async () => {
            const result = await toggleFollow(brandId, previous)
            if (!result.ok) {
              setFollowing(previous)
              setCount((n) => n + (previous ? 1 : -1))
              // Following a brand is a retailer's action, and the storefront
              // it sits on is public — so pressing this signed out means sign
              // in, not failure.
              if (result.signInRequired) router.push(loginHref(pathname))
              return
            }
            setFollowing(result.result.following)
            setCount(result.result.followerCount)
          })
        }}
      >
        {following ? (
          <>
            <Check className="size-4" /> {t('stores.isFollowing')}
          </>
        ) : (
          <>
            <Plus className="size-4" /> {t('stores.follow')}
          </>
        )}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t(count === 1 ? 'stores.followerOne' : 'stores.followerMany', {
          n: count,
        })}
      </span>
    </div>
  )
}
