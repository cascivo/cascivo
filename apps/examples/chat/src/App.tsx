import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { AiChat } from '@cascivo/ai'
import { Alert, Button, EmptyState, Select, Spinner } from '@cascivo/react'
import type { SideNavItem } from '@cascivo/react'
import { MessageSquare, Plus2, StopCircle, Trash2 } from '@cascivo/icons'
import { AppShell } from '@cascivo/example-kit'
import { MODELS, isModelId } from './lib/protocol'
import {
  activeConversation,
  activeId,
  conversations,
  deleteChat,
  draft,
  error,
  model,
  newChat,
  retry,
  selectChat,
  send,
  setModel,
  sortedConversations,
  stop,
  streamingId,
} from './store'
import { msg } from './i18n'
import styles from './App.module.css'

import '@cascivo/tokens'
import '@cascivo/themes/dark.css'
import '@cascivo/themes/light.css'
import '@cascivo/themes/warm.css'

const MODEL_OPTIONS = MODELS.map((m) => ({ value: m.id, label: m.label }))

export default function App() {
  useSignals()

  const active = activeConversation.value
  const streamingHere = streamingId.value !== null && streamingId.value === active?.id
  const messages = (active?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.stopped ? `${m.content} [${t(msg.stopped)}]` : m.content,
  }))

  const navItems: SideNavItem[] = sortedConversations.value.map((c) => ({
    id: c.id,
    label: c.title,
    icon: <MessageSquare size={16} />,
    active: c.id === activeId.value,
    onClick: (e) => {
      e.preventDefault()
      selectChat(c.id)
    },
  }))

  return (
    <AppShell brand={{ name: t(msg.appTitle) }} navItems={navItems}>
      {!conversations.ready.value ? (
        <div className={styles['loading']}>
          <Spinner label={t(msg.loading)} />
        </div>
      ) : (
        <div className={styles['main']}>
          {messages.length === 0 && !streamingHere && (
            <EmptyState title={t(msg.emptyTitle)} description={t(msg.emptyDescription)} />
          )}
          {error.value !== null && (
            <Alert
              variant="destructive"
              title={t(msg.errorTitle)}
              action={{ label: t(msg.retry), onClick: () => void retry() }}
            >
              {error.value}
            </Alert>
          )}
          <div className={styles['toolbar']}>
            <div className={styles['actions']}>
              <Select
                ariaLabel={t(msg.model)}
                size="sm"
                options={MODEL_OPTIONS}
                value={model.value}
                onChange={(e) => {
                  if (isModelId(e.target.value)) setModel(e.target.value)
                }}
              />
              <Button size="sm" variant="secondary" onClick={newChat}>
                <Plus2 size={16} />
                {t(msg.newChat)}
              </Button>
            </div>
            {streamingHere && (
              <Button size="sm" variant="ghost" onClick={stop}>
                <StopCircle size={16} />
                {t(msg.stop)}
              </Button>
            )}
            {active && !streamingHere && (
              <Button size="sm" variant="ghost" onClick={() => deleteChat(active.id)}>
                <Trash2 size={16} />
                {t(msg.deleteChat)}
              </Button>
            )}
          </div>
          <div className={styles['chat']}>
            <AiChat
              messages={messages}
              onSend={(text) => void send(text)}
              isStreaming={streamingId.value !== null}
              {...(streamingHere ? { streamingText: draft.value } : {})}
            />
          </div>
        </div>
      )}
    </AppShell>
  )
}
