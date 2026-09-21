import { emit } from './emit.ts'
import type { TextOptions } from './options.ts'
import { resolveOptions } from './options.ts'
import { parseHtml } from './parse.ts'

/**
 * Serialize rendered HTML to Markdown.
 *
 * The input is expected to be a renderer's output — `renderToStaticMarkup`, or any
 * well-formed HTML. Control values come from the markup, which is what a server-rendered
 * page has; for the values a person has actually typed, use `elementToMarkdown` on the live
 * DOM instead.
 */
export function toMarkdown(html: string, options?: TextOptions): string {
  return emit(parseHtml(html), resolveOptions(options))
}
