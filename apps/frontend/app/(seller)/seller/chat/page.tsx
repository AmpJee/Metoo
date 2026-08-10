import { MessageCircle, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChatThread } from '@/components/chat-thread'
import { Card, CardEmpty } from '@/components/console/card'
import { PageHeader } from '@/components/dashboard-shell'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { getLocale, getT } from '@/lib/i18n/server'
import type { ChatMessage, ChatThread as Thread, Me } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('nav.seller.chat') }
}

/**
 * The brand's side of Messages.
 *
 * The same two panes and the same `ChatThread` the shop uses — the API is
 * symmetric, so a second implementation would only be a second place for the
 * two sides to drift apart. What differs is the shell (console, not shop) and
 * who the counterparty is: a brand sees the shop that wrote to it.
 *
 * There is no "new conversation" here on purpose. A retailer opens a thread
 * from a storefront; a brand replies to threads it is already in. That is what
 * keeps this a support channel rather than an outbound marketing one, and it
 * is enforced by the API — POST /chat/threads is retailer-only.
 */
export default async function SellerChatPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>
}) {
  const t = await getT()
  const locale = await getLocale()
  const { t: requested } = await searchParams

  const [me, threads] = await Promise.all([
    api.get<Me>('/auth/me'),
    api.get<Thread[]>('/chat/threads'),
  ])

  const open = threads.find((thread) => thread.id === requested) ?? threads[0]

  const messages = open
    ? await api
        .get<{ items: ChatMessage[] }>(`/chat/threads/${open.id}/messages`)
        .then((page) => page.items)
        .catch(() => [] as ChatMessage[])
    : []

  return (
    <>
      <PageHeader title={t('nav.seller.chat')} />

      {threads.length === 0 ? (
        <Card>
          <CardEmpty
            icon={MessageCircle}
            title={t('sellerChat.emptyTitle')}
            description={t('sellerChat.emptyBody')}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <nav
            className="flex flex-col gap-2"
            aria-label={t('nav.seller.chat')}
          >
            {threads.map((thread) => {
              const active = open?.id === thread.id
              return (
                <Link
                  key={thread.id}
                  href={`/seller/chat?t=${thread.id}`}
                  className={`flex items-start gap-3 rounded-[9px] border bg-white p-3 transition-colors ${
                    active
                      ? 'border-[#cb2957] bg-[#cb2957]/[0.04]'
                      : 'border-black/10 hover:border-[#cb2957]'
                  }`}
                >
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-black/5">
                    {thread.counterparty.logoUrl ? (
                      <Image
                        src={thread.counterparty.logoUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <Store className="m-auto size-4 translate-y-[10px] text-black/40" />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-medium">
                        {thread.counterparty.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-black/50">
                        {formatDate(thread.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="truncate text-[13px] text-black/50">
                      {thread.lastMessage?.body ?? ''}
                    </span>
                  </span>

                  {thread.unreadCount > 0 ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#cb2957] text-[10px] font-semibold text-white">
                      {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          {open ? (
            <ChatThread
              key={open.id}
              threadId={open.id}
              counterpartyName={open.counterparty.name}
              // A brand is talking to a shop, so the subtitle says shop —
              // the buyer's copy calls the other side a brand.
              counterpartyLine={t('sellerChat.shopLine')}
              viewerId={me.id}
              initialMessages={messages}
              hasUnread={open.unreadCount > 0}
            />
          ) : null}
        </div>
      )}
    </>
  )
}
