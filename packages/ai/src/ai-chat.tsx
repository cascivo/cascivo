'use client'
import { useRef } from 'react'
import { useSignal, useSignals } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import { StreamingText } from './streaming-text'
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
  className?: string
}

export function AiChat({
  messages,
  onSend,
  isStreaming = false,
  streamingText,
  className,
}: AiChatProps) {
  useSignals()
  const inputValue = useSignal('')
  const listRef = useRef<HTMLDivElement>(null)

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
      <div ref={listRef} className={styles.messages} role="log" aria-live="polite">
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
        {isStreaming && streamingText !== undefined && (
          <div className={styles.message} data-role="assistant">
            <span className={styles.roleLabel}>{t(builtin.ai.assistant)}</span>
            <div className={styles.content}>
              <StreamingText text={streamingText} />
            </div>
          </div>
        )}
      </div>
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
