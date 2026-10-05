'use client'
import { useRef } from 'react'
import {
  announce,
  useEffectPropSignal,
  useSignal,
  useSignalEffect,
  useSignals,
} from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { AiStatus } from '../../components/src/ai-status/ai-status'
import { StreamingText } from '../../components/src/streaming-text/streaming-text'
import { TypingIndicator } from '../../components/src/typing-indicator/typing-indicator'
import styles from './ai-chat.module.css'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiChatProps {
  messages: ChatMessage[]
  onSend: (text: string) => void
  isStreaming?: boolean
  streamingText?: string
  onStop?: () => void
  className?: string
}

const PIN_THRESHOLD_PX = 32

export function AiChat({
  messages,
  onSend,
  isStreaming = false,
  streamingText,
  onStop,
  className,
}: AiChatProps) {
  useSignals()
  const inputValue = useSignal('')
  const listRef = useRef<HTMLDivElement>(null)
  const streaming = useEffectPropSignal(isStreaming)
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const wasStreaming = useRef(false)

  // The log is not a live region (a streamed reply would be read out token by token), so
  // the finished reply is announced once, when streaming ends.
  useSignalEffect(() => {
    const now = streaming.value
    if (wasStreaming.current && !now) {
      const reply = messagesRef.current.filter((m) => m.role === 'assistant').at(-1)
      if (reply) announce(reply.content, { batchId: 'cascivo-ai-chat' })
    }
    wasStreaming.current = now
  })

  // Follow new content (a new message, or a reply streaming in) while the reader is at the
  // bottom of the log; once they scroll up to read history, leave the position alone.
  useSignalEffect(() => {
    const list = listRef.current
    if (!list) return
    let pinned = true
    const onScroll = () => {
      pinned = list.scrollHeight - list.scrollTop - list.clientHeight < PIN_THRESHOLD_PX
    }
    const observer = new MutationObserver(() => {
      if (pinned) list.scrollTop = list.scrollHeight
    })
    observer.observe(list, { childList: true, subtree: true, characterData: true })
    list.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      list.removeEventListener('scroll', onScroll)
    }
  })

  function handleSend() {
    const text = inputValue.value.trim()
    if (!text) return
    onSend(text)
    inputValue.value = ''
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div ref={listRef} className={styles.messages} role="log" aria-live="off">
        {messages
          .filter((m) => m.role !== 'system')
          .map((msg) => (
            <div key={msg.id} className={styles.message} data-role={msg.role}>
              <span className={styles.roleLabel}>
                {msg.role === 'user' ? t(builtin.ai.you) : t(builtin.ai.assistant)}
              </span>
              <div className={styles.content}>{msg.content}</div>
            </div>
          ))}
        {isStreaming && (
          <div className={styles.message} data-role="assistant" aria-busy="true">
            <span className={styles.roleLabel}>{t(builtin.ai.assistant)}</span>
            <div className={styles.content}>
              {streamingText ? <StreamingText text={streamingText} /> : <TypingIndicator />}
            </div>
          </div>
        )}
      </div>
      {isStreaming && onStop && (
        <div className={styles.status}>
          <AiStatus status="generating" onStop={onStop} />
        </div>
      )}
      <div className={styles.inputArea}>
        <textarea
          className={styles.textarea}
          placeholder={t(builtin.ai.placeholder)}
          value={inputValue.value}
          onChange={(e) => {
            inputValue.value = e.target.value
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          aria-label={t(builtin.ai.placeholder)}
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={handleSend}
          disabled={isStreaming}
          aria-label={t(builtin.ai.send)}
        >
          {t(builtin.ai.send)}
        </button>
      </div>
    </div>
  )
}
