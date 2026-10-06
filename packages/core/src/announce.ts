export type AnnouncePoliteness = 'polite' | 'assertive'

export interface AnnounceOptions {
  /**
   * `polite` (default) waits for the screen reader to finish; `assertive` interrupts. Keep
   * `assertive` for errors that stop the reader's flow.
   */
  politeness?: AnnouncePoliteness
  /**
   * Announcements sharing a `batchId` replace each other: a newer one cancels an older one
   * that has not been spoken yet. Use one id per source (e.g. a message's id) so a burst of
   * interim updates collapses into the last.
   */
  batchId?: string
}

/**
 * Delay between clearing the region and writing the message. A live region announces a
 * CHANGE, so writing the same text twice would be silent; clearing first and writing on a
 * later task makes every call audible, and gives a region created in this same call time to
 * be registered by the accessibility tree before it changes.
 */
const WRITE_DELAY_MS = 50

const regions = new Map<AnnouncePoliteness, HTMLElement>()
const pending = new Map<string, ReturnType<typeof setTimeout>>()

function region(politeness: AnnouncePoliteness): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const existing = regions.get(politeness)
  if (existing?.isConnected) return existing

  const el = document.createElement('div')
  el.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status')
  el.setAttribute('aria-live', politeness)
  el.setAttribute('aria-atomic', 'true')
  // Visually hidden, still in the accessibility tree. Inline so it needs no stylesheet.
  el.style.cssText =
    'position:absolute;inline-size:1px;block-size:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0'
  document.body.append(el)
  regions.set(politeness, el)
  return el
}

/**
 * Say `message` to screen-reader users through one shared, persistent live region — without
 * putting `aria-live` on the content itself.
 *
 * The primitive behind the AI announcement contract: announce transitions ("Response
 * complete", "Feedback recorded"), never streamed tokens. Call it from an event handler or a
 * `useSignalEffect`, not during render. SSR-safe: with no `document` it does nothing.
 */
export function announce(message: string, options: AnnounceOptions = {}): void {
  const { politeness = 'polite', batchId } = options
  const el = region(politeness)
  if (!el) return

  if (batchId !== undefined) {
    const queued = pending.get(batchId)
    if (queued !== undefined) clearTimeout(queued)
  }

  el.textContent = ''
  const timer = setTimeout(() => {
    el.textContent = message
    if (batchId !== undefined) pending.delete(batchId)
  }, WRITE_DELAY_MS)
  if (batchId !== undefined) pending.set(batchId, timer)
}
