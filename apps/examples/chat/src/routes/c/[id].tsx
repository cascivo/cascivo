import type { RouteProps } from '@cascivo/app'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, EmptyState } from '@cascivo/react'
import { ChatView } from '../../ChatView'
import { conversations, newChat } from '../../store'
import { msg } from '../../i18n'

/** `/c/:id` — one conversation. History is per browser, so a shared link may not resolve. */
export default function ConversationRoute({ params }: RouteProps<'/c/:id'>) {
  useSignals()
  const conversation = conversations.value.find((c) => c.id === params.id)
  if (!conversation) {
    return (
      <EmptyState
        title={t(msg.conversationMissing)}
        description={t(msg.conversationMissingDescription)}
        action={<Button onClick={newChat}>{t(msg.newChat)}</Button>}
      />
    )
  }
  return <ChatView conversation={conversation} />
}
