import { emit } from './emit.ts'
import { fromElement } from './from-dom.ts'
import type { TextOptions } from './options.ts'
import { resolveOptions } from './options.ts'

/**
 * Serialize a live DOM subtree to Markdown, including the current state of every control —
 * typed values, checked boxes, the selected tab, an open disclosure.
 */
export function elementToMarkdown(el: Element, options?: TextOptions): string {
  return emit(fromElement(el), resolveOptions(options))
}
