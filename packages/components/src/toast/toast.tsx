'use client'
import { createMachine, signal, useMachine, useSignalEffect, useSignals } from '@cascade-ui/core'
import { builtin, t } from '@cascade-ui/i18n'
import { useRef, type ReactNode } from 'react'
import styles from './toast.module.css'

export type ToastVariant = 'default' | 'success' | 'warning' | 'destructive'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastRecord extends ToastOptions {
  id: number
}

const MAX_VISIBLE = 3
const DEFAULT_DURATION = 5000
// must outlast --cascivo-motion-exit (150ms)
const EXIT_DURATION = 160

// App-global queue: toasts are not tied to a single render tree, so a module
// signal lets useToast() enqueue from anywhere without React context.
let nextToastId = 0
const toastQueue = signal<ToastRecord[]>([])

function enqueue(options: ToastOptions) {
  toastQueue.value = [...toastQueue.value, { id: nextToastId++, ...options }]
}

function dequeue(id: number) {
  toastQueue.value = toastQueue.value.filter((toast) => toast.id !== id)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  useSignals()
  const visible = toastQueue.value.slice(-MAX_VISIBLE)

  return (
    <>
      {children}
      <div className={styles['viewport']} role="region" aria-label={t(builtin.toast.region)}>
        {visible.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dequeue(toast.id)} />
        ))}
      </div>
    </>
  )
}

const machine = createMachine({
  initial: 'visible' as const,
  states: {
    visible: { on: { DISMISS: 'dismissing' } },
    dismissing: { on: { END: 'gone' } },
  },
})

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: () => void }) {
  useSignals()
  const [state, send] = useMachine(machine)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const duration = toast.duration ?? DEFAULT_DURATION
  const assertive = toast.variant === 'destructive'

  useSignalEffect(() => {
    const phase = state.value
    if (phase === 'visible') {
      const timer = setTimeout(() => send('DISMISS'), duration)
      return () => clearTimeout(timer)
    }
    if (phase === 'dismissing') {
      const timer = setTimeout(() => onDismissRef.current(), EXIT_DURATION)
      return () => clearTimeout(timer)
    }
    return undefined
  })

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      data-variant={toast.variant ?? 'default'}
      data-state={state.value}
      className={styles['toast']}
    >
      <div className={styles['body']}>
        <div className={styles['title']}>{toast.title}</div>
        {toast.description && <div className={styles['description']}>{toast.description}</div>}
      </div>
      <button
        type="button"
        className={styles['close']}
        aria-label={t(builtin.toast.dismiss)}
        onClick={() => send('DISMISS')}
      >
        ✕
      </button>
    </div>
  )
}

export function useToast() {
  return { toast: enqueue }
}

export function dismissAllToasts() {
  toastQueue.value = []
}
