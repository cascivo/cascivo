import { cn } from '@cascivo/core/pure'
import type { Tone } from '@cascivo/core'
import { builtin, t } from '@cascivo/i18n'
import type { HTMLAttributes, ReactNode } from 'react'
import { Badge } from '../badge/badge'
import styles from './tool-call.module.css'

export type ToolCallStatus =
  | 'pending'
  | 'running'
  | 'awaiting-approval'
  | 'complete'
  | 'error'
  | 'denied'

export interface ToolCallProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  status: ToolCallStatus
  input?: ReactNode
  output?: ReactNode
  error?: ReactNode
  actions?: ReactNode
  labels?: {
    pending?: string
    running?: string
    awaitingApproval?: string
    complete?: string
    error?: string
    denied?: string
    input?: string
    output?: string
    errorHeading?: string
  }
}

const TONE: Record<ToolCallStatus, Tone> = {
  pending: 'neutral',
  running: 'info',
  'awaiting-approval': 'warning',
  complete: 'success',
  error: 'danger',
  denied: 'neutral',
}

function statusLabel(status: ToolCallStatus, labels: ToolCallProps['labels']): string {
  switch (status) {
    case 'pending':
      return labels?.pending ?? t(builtin.toolCall.pending)
    case 'running':
      return labels?.running ?? t(builtin.toolCall.running)
    case 'awaiting-approval':
      return labels?.awaitingApproval ?? t(builtin.toolCall.awaitingApproval)
    case 'complete':
      return labels?.complete ?? t(builtin.toolCall.complete)
    case 'error':
      return labels?.error ?? t(builtin.toolCall.error)
    case 'denied':
      return labels?.denied ?? t(builtin.toolCall.denied)
  }
}

/** A string payload (typically `JSON.stringify(args, null, 2)`) is preformatted; a node is the caller's. */
function Payload({ value }: { value: ReactNode }) {
  return typeof value === 'string' ? (
    <pre className={styles['code']}>
      <code>{value}</code>
    </pre>
  ) : (
    <div className={styles['content']}>{value}</div>
  )
}

export function ToolCall({
  name,
  status,
  input,
  output,
  error,
  actions,
  labels,
  className,
  ...props
}: ToolCallProps) {
  const header = (
    <>
      <span className={styles['glyph']} aria-hidden="true">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
          <path
            d="M10.2 2.3a3.2 3.2 0 0 0-3.9 4.1L2.6 10.1a1.4 1.4 0 0 0 2 2l3.7-3.7a3.2 3.2 0 0 0 4.1-3.9l-2 2-1.8-.4-.4-1.8 2-2Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <code className={styles['name']}>{name}</code>
      <Badge variant={TONE[status]} className={styles['badge']}>
        {statusLabel(status, labels)}
      </Badge>
    </>
  )
  const hasBody = input !== undefined || output !== undefined || error !== undefined

  return (
    <div
      data-status={status}
      className={cn(styles['tool-call'], className as string | undefined)}
      {...props}
    >
      {hasBody ? (
        // Opens itself on failure so the error is in view; otherwise the reader opens it.
        // React only re-applies `open` when the status flips, so a reader's toggle sticks.
        <details className={styles['disclosure']} open={status === 'error' || undefined}>
          <summary className={styles['summary']}>
            {header}
            <span className={styles['indicator']} aria-hidden="true" />
          </summary>
          <div className={styles['body']}>
            {input !== undefined && (
              <div className={styles['section']}>
                <div className={styles['section-label']}>
                  {labels?.input ?? t(builtin.toolCall.input)}
                </div>
                <Payload value={input} />
              </div>
            )}
            {output !== undefined && (
              <div className={styles['section']}>
                <div className={styles['section-label']}>
                  {labels?.output ?? t(builtin.toolCall.output)}
                </div>
                <Payload value={output} />
              </div>
            )}
            {error !== undefined && (
              <div className={styles['section']} data-kind="error">
                <div className={styles['section-label']}>
                  {labels?.errorHeading ?? t(builtin.toolCall.errorHeading)}
                </div>
                <Payload value={error} />
              </div>
            )}
          </div>
        </details>
      ) : (
        <div className={styles['summary']}>{header}</div>
      )}
      {actions ? <div className={styles['actions']}>{actions}</div> : null}
    </div>
  )
}
