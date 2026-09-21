/**
 * Machine mode — a rendered cascivo UI as a Markdown document.
 *
 * ```ts
 * import { renderToStaticMarkup } from 'react-dom/server'
 * import { toMarkdown } from '@cascivo/text'
 *
 * const doc = toMarkdown(renderToStaticMarkup(<Dashboard />))
 * ```
 *
 * No CSS, no hydration, no client JavaScript: `@cascivo/react`'s `node` export condition
 * resolves to the CSS-free twin, so this runs in a bare Node process with no bundler.
 *
 * See `emit.ts` for the rule the serializer follows and what it deliberately keeps.
 */
export { toMarkdown } from './to-markdown.ts'
export { elementToMarkdown } from './element-to-markdown.ts'
export type { TextOptions } from './options.ts'
