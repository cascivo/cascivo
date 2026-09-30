import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { AiChat } from '@cascivo/ai'
import { Alert, Button, EmptyState, Select } from '@cascivo/react'
import { Plus2, StopCircle, Trash2 } from '@cascivo/icons'
import { MODELS, isModelId } from './lib/protocol'
import {
  deleteChat,
  draft,
  error,
  model,
  newChat,
  retry,
  send,
  setModel,
  stop,
  streamingId,
} from './store'
import type { Conversation } from './store'
import { msg } from './i18n'
import styles from './App.module.css'

const MODEL_OPTIONS = MODELS.map((m) => ({ value: m.id, label: m.label }))

export interface ChatViewProps {
  /** The open conversation; `null` on `/`, where the first message creates one. */
  conversation: Conversation | null
}

export function ChatView({ conversation }: ChatViewProps) {
  useSignals()

  const active = conversation
  const streamingHere = streamingId.value !== null && streamingId.value === active?.id
  const failure =
    error.value !== null && error.value.conversationId === active?.id ? error.value.message : null
  const messages = (active?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.stopped ? `${m.content} [${t(msg.stopped)}]` : m.content,
  }))

  return (
    <div className={styles['main']}>
      {messages.length === 0 && !streamingHere && (
        <EmptyState title={t(msg.emptyTitle)} description={t(msg.emptyDescription)} />
      )}
      {failure !== null && (
        <Alert
          variant="destructive"
          title={t(msg.errorTitle)}
          action={{ label: t(msg.retry), onClick: () => void retry() }}
        >
          {failure}
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
  )
}
