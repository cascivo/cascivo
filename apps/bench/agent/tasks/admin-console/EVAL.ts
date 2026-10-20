import type { Page } from '@playwright/test'

// Stub until the hidden checks for this task are written; scoring treats a throw as fail-eval.
export default async function evaluate(_page: Page, _baseUrl: string): Promise<void> {
  throw new Error('not implemented')
}
