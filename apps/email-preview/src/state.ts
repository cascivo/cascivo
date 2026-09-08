/**
 * Preview state.
 *
 * Signals rather than `useState`, per the repo's reactivity rule. Every component that
 * reads `.value` during render calls `useSignals()` first — this app gets no Babel signals
 * transform, so without it the UI would freeze while handlers kept firing.
 */
import { signal } from '@cascivo/core'
import { SIMULATED_CLIENTS, type EmailTheme } from '@cascivo/email'

/** Widths the preview offers. 600 is the canonical email content width. */
export const VIEWPORTS = [
  { label: 'Small phone', width: 320 },
  { label: 'Phone', width: 375 },
  { label: 'Large phone', width: 414 },
  { label: 'Email width', width: 600 },
  { label: 'Desktop pane', width: 1024 },
] as const

export type Tab = 'preview' | 'html' | 'text'

export const templateId = signal<string>('password-reset')
export const theme = signal<EmailTheme>('light')
export const viewport = signal<number>(600)
/** `null` renders the email untouched; otherwise the named client's support is simulated. */
export const clientLabel = signal<string | null>(null)
export const tab = signal<Tab>('preview')
export const darkModeSimulation = signal<boolean>(false)

export function clientFor(label: string | null) {
  return label === null ? null : (SIMULATED_CLIENTS.find((c) => c.label === label) ?? null)
}
