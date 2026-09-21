import { toMarkdown } from '@cascivo/text'
import type { TextOptions } from '@cascivo/text'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CascadeView } from './cascade-view'
import type { ViewConfig } from './types'

export interface ViewToMarkdownOptions {
  /** The host data a `$data.*` binding resolves against, exactly as `<CascadeView>` takes it. */
  data?: Record<string, unknown>
  /** Serialization options, forwarded to `@cascivo/text`. */
  text?: TextOptions
}

/**
 * A `ViewConfig` as a Markdown document — machine mode for the JSON view format.
 *
 * This renders the real components and serializes their output, rather than walking
 * `ComponentNode`s and printing each one. Walking the config would need a text renderer per
 * entry in `componentMap` and would drift from the components the moment one of them changed
 * what it renders; this is a config away from the same document a human sees.
 *
 * Actions are not bound: a document has nothing to click, so `$actions.*` and `$state.set.*`
 * events resolve to nothing. Declared `state` still supplies its initial values, so a view's
 * starting text is exactly what a reader would first see.
 */
export function viewToMarkdown(config: ViewConfig, options?: ViewToMarkdownOptions): string {
  const html = renderToStaticMarkup(
    createElement(CascadeView, {
      config,
      ...(options?.data === undefined ? {} : { data: options.data }),
    }),
  )
  return toMarkdown(html, options?.text)
}
