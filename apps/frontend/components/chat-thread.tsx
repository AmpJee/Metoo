'use client'

import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { markThreadRead, sendMessage } from '@/app/actions/chat'
import { useLocale, useT } from '@/components/i18n-provider'
import { formatDate } from '@/lib/format'
import type { ChatMessage } from '@/lib/types'

/**
 * One conversation.
 *
 * Messages arrive from the server oldest-first and are kept in local state so
 * a sent message appears immediately — a chat that waits for a round trip
 * before showing your own words reads as broken even when it works.
 *
 * `viewerId` decides which side a bubble sits on. It is the sender id the API
 * puts on each message, not the account id, because a brand and a retailer are
 * different profiles on the same conversation.
 */
export function ChatThread({
  threadId,
  counterpartyName,
  counterpartyLine,
  viewerId,
  initialMessages,
  hasUnread,
}: {
  threadId: string
  counterpartyName: string
  /**
   * The line under the name. Passed in rather than fixed, because the two
   * sides of a thread describe each other differently: a shop is talking to a
   * brand, and the brand is talking to a shop.
   */
  counterpartyLine?: string
  viewerId: string
  initialMessages: ChatMessage[]
  hasUnread: boolean
}) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  // A different thread was opened: adopt its messages rather than appending
  // to the previous conversation.
  useEffect(() => {
    setMessages(initialMessages)
    setDraft('')
    setError(null)
  }, [initialMessages, threadId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  // Opening a thread is what marks it read — not hovering the list — so the
  // badge clears exactly when the words are actually on screen.
  useEffect(() => {
    if (hasUnread) void markThreadRead(threadId)
  }, [threadId, hasUnread])

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return

    setError(null)
    startTransition(async () => {
      const result = await sendMessage(threadId, body)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessages((current) => [...current, result.data])
      setDraft('')
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-[520px] flex-col rounded-[9px] border border-border">
      <header className="border-b border-border px-5 py-4">
        <p className="font-semibold">{counterpartyName}</p>
        <p className="text-xs text-muted-foreground">
          {counterpartyLine ?? t('chat.brandLine')}
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <p className="m-auto text-sm text-muted-foreground">
            {t('chat.noMessages')}
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === viewerId
            return (
              <div
                key={message.id}
                className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}
              >
                <span
                  className={`max-w-[78%] rounded-[14px] px-4 py-2 text-sm ${
                    mine
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {message.body}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(message.createdAt, locale)}
                </span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('chat.placeholder')}
          maxLength={2000}
          disabled={pending}
          className="h-11 flex-1 rounded-lg bg-input px-4 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          // Whitespace alone is rejected by the API too; refusing it here
          // means the button simply never sends an empty bubble.
          disabled={pending || draft.trim() === ''}
          aria-label={t('chat.send')}
          className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>

      {error ? (
        <p role="alert" className="px-5 pb-4 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
