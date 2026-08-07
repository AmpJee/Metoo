'use client'

import { Check, Plus } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toggleFollow } from '@/app/actions/follow'
import { useT } from '@/components/i18n-provider'
import { Button } from '@/components/ui/button'

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
