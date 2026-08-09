import { MessageCircle, Store } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChatThread } from '@/components/chat-thread'
import { EmptyState } from '@/components/ui/empty-state'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { getLocale } from '@/lib/i18n/server'
import { getT } from '@/lib/i18n/server'
import type { ChatMessage, ChatThread as Thread, Me } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return { title: t('chat.title') }
}

/**
 * Messages — the designer's two-pane layout: conversations on the left, the
 * open one on the right.
 *
 * Which thread is open lives in the URL rather than in state, so a
 * conversation can be linked to. That is what makes "chat now" on an order and
 * "Chat with brand" on a storefront able to land somebody in the right place.
 *
 * A brand replies to threads but never opens one, which is why there is no
 * "new conversation" button here: the entry points are all on the buyer's
 * side, and that is what keeps this a support channel rather than an outbound
 * marketing one.
 */
export default async function ChatPage({
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

  // The requested thread, or the most recent one — the list comes back newest
  // first, so landing on nothing when there is a conversation to read would be
  // an empty screen for no reason.
  const open = threads.find((thread) => thread.id === requested) ?? threads[0]

  const messages = open
    ? await api
        .get<{ items: ChatMessage[] }>(`/chat/threads/${open.id}/messages`)
        .then((page) => page.items)
        .catch(() => [] as ChatMessage[])
    : []

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="mb-6 text-[20px] font-bold md:text-[28px]">
        {t('chat.title')}
      </h1>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={t('chat.emptyTitle')}
          description={t('chat.emptyBody')}
          action={{ label: t('nav.stores'), href: '/stores' }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <nav className="flex flex-col gap-2" aria-label={t('chat.title')}>
            {threads.map((thread) => {
              const active = open?.id === thread.id
              return (
                <Link
                  key={thread.id}
                  href={`/chat?t=${thread.id}`}
                  className={`flex items-start gap-3 rounded-[9px] border p-3 transition-colors ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-secondary">
                    {thread.counterparty.logoUrl ? (
                      <Image
                        src={thread.counterparty.logoUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <Store className="m-auto size-4 translate-y-[10px] text-muted-foreground" />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {thread.counterparty.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDate(thread.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {thread.lastMessage?.body ?? ''}
                    </span>
                  </span>

                  {thread.unreadCount > 0 ? (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>

          {open ? (
            <ChatThread
              // Keyed by thread so switching conversations remounts rather
              // than carrying the previous draft and scroll position across.
              key={open.id}
              threadId={open.id}
              counterpartyName={open.counterparty.name}
              viewerId={me.id}
              initialMessages={messages}
              hasUnread={open.unreadCount > 0}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
