import { signal } from '@cascivo/core'

/** Shared open-state for the CMD+K search dialog (read by App and Header). */
export const searchOpen = signal(false)
