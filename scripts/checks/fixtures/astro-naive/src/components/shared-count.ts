import { signal } from '@cascivo/react'

/** Module-level state: two islands importing this module share one instance in the browser. */
export const sharedCount = signal(0)
