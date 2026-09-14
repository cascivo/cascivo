/**
 * `Markdown` — prose that is not known until send time.
 *
 * Every node renders through the primitives in this directory, never through
 * `dangerouslySetInnerHTML`. That is the whole design: the conformance lint reads finished
 * markup, so as long as the renderer can only emit elements the primitives already emit,
 * a Markdown subtree is exactly as checkable as a hand-composed one. `markdown/parse.ts`
 * carries the reasoning; this file carries the mapping.
 *
 * ## Supported
 *
 * | Markdown                   | Renders as                                |
 * | -------------------------- | ----------------------------------------- |
 * | `# …` — `###### …`         | `Heading` at that level                   |
 * | paragraph                  | `Text`                                    |
 * | `**bold**`, `__bold__`     | `<strong>`                                |
 * | `*italic*`, `_italic_`     | `<em>`                                    |
 * | `` `code` ``               | `<code>` in the mono stack                |
 * | ` ```fenced``` `           | `<pre>` in a padded cell                  |
 * | `[text](https://…)`, `<url>`     | `Link`                                    |
 * | `![alt](https://…)`              | `Img`, at the `imageWidth` prop's width   |
 * | `- item`, `1. item`        | `List`                                    |
 * | `> quote`                  | an accented block, nestable               |
 * | `---`                      | `Hr`                                      |
 *
 * Anything else — tables, footnotes, raw HTML, reference links — renders as its own literal
 * text. That is the allowlist working, not a bug: prose fetched from a CMS at send time
 * must never be able to fail a send, so the parser degrades instead of throwing.
 *
 * ## Two things worth knowing before you use it
 *
 * `href` and `src` are accepted only when they name `http:`, `https:` or `mailto:`. A link
 * with any other scheme keeps its label and loses its anchor; an image keeps its alt text.
 * The repo's rule about never trusting a payload you did not produce applies to a CMS
 * exactly as it does to a registry.
 *
 * A code block does not wrap. `css-white-space` is `n` in Outlook Windows and partial in
 * Gmail's mobile apps, so there is no dependable way to fold a long line — `<pre>`'s own UA
 * behaviour is all there is. Keep fenced lines short, or use `Text` for anything long.
 */
import { Fragment, type ReactNode } from 'react'
import { parseMarkdown, type Block, type Inline } from '../markdown/parse.ts'
import { fontStack } from '../runtime/fonts.ts'
import { token } from '../runtime/palette.ts'
import type { Style } from '../runtime/style.ts'
import { Img } from './content.tsx'
import { CONTENT_WIDTH, Hr, Spacer, TABLE_RESET } from './layout.tsx'
import { Heading, Link, List, Text } from './typography.tsx'

/* eslint-disable react/no-array-index-key -- Every key in this file indexes a node of a
   freshly parsed tree in a one-shot server render. There is no reconciliation to preserve
   and no identity to carry, and the nodes have no id of their own to use instead. */

export interface MarkdownProps {
  /** The Markdown source. */
  children: string
  /** Vertical space between blocks, in pixels. */
  spacing?: number
  /**
   * Width in pixels for `![alt](https://…)` images.
   *
   * Markdown carries no dimensions and `Img` requires a width — Outlook sizes from the
   * attribute and renders at intrinsic size without one. The default is the canonical
   * content width; pass the inner width of your container if it is narrower. Images keep
   * `max-width: 100%`, so this is a ceiling rather than a fixed size.
   */
  imageWidth?: number
}

/**
 * Render inline nodes.
 *
 * Text comes back as a bare string rather than wrapped in a `<span>`. React needs no key
 * for a string in an array, and a wrapper on every text run would cost ~13 bytes each in a
 * document whose whole point is the byte budget.
 */
function renderInline(nodes: Inline[], imageWidth: number): ReactNode[] {
  return nodes.map((node, i) => {
    switch (node.kind) {
      case 'text':
        return node.value
      case 'strong':
        return <strong key={i}>{renderInline(node.children, imageWidth)}</strong>
      case 'em':
        return <em key={i}>{renderInline(node.children, imageWidth)}</em>
      case 'code':
        return (
          <code key={i} style={{ fontFamily: fontStack('mono'), fontSize: '14px' }}>
            {node.value}
          </code>
        )
      case 'link':
        return (
          <Link key={i} href={node.href}>
            {renderInline(node.children, imageWidth)}
          </Link>
        )
      case 'image':
        return <Img key={i} src={node.src} alt={node.alt} width={imageWidth} />
    }
  })
}

/** A fenced code block or a blockquote — both are one padded, tinted cell. */
function Panel({ children, accent }: { children: ReactNode; accent?: string }) {
  const cell: Style = {
    padding: '12px 16px',
    backgroundColor: token('--cascivo-color-surface-2', token('--cascivo-color-surface')),
    ...(accent === undefined ? {} : { borderLeft: `4px solid ${accent}` }),
  }
  return (
    <table {...TABLE_RESET} width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td style={cell}>{children}</td>
        </tr>
      </tbody>
    </table>
  )
}

function renderBlock(block: Block, imageWidth: number, spacing: number): ReactNode {
  switch (block.kind) {
    case 'heading':
      return <Heading level={block.level}>{renderInline(block.children, imageWidth)}</Heading>
    case 'paragraph':
      // A paragraph of nothing but images renders them directly. `Img` is a `<table>` when
      // it is linked, and Outlook Windows ends a `<p>` at a nested table — the rest of the
      // paragraph then escapes its own styling.
      return block.children.every((n) => n.kind === 'image') ? (
        <>{renderInline(block.children, imageWidth)}</>
      ) : (
        <Text>{renderInline(block.children, imageWidth)}</Text>
      )
    case 'list':
      return (
        <List
          ordered={block.ordered}
          items={block.items.map((item) => renderInline(item, imageWidth))}
        />
      )
    case 'code':
      return (
        <Panel>
          <pre
            style={{
              margin: 0,
              fontFamily: fontStack('mono'),
              fontSize: '14px',
              lineHeight: '1.5',
              color: token('--cascivo-color-foreground'),
            }}
          >
            {block.value}
          </pre>
        </Panel>
      )
    case 'quote':
      return (
        <Panel accent={token('--cascivo-color-border-strong', token('--cascivo-color-border'))}>
          {renderBlocks(block.children, imageWidth, spacing)}
        </Panel>
      )
    case 'hr':
      return <Hr spacing={spacing} />
  }
}

function renderBlocks(blocks: Block[], imageWidth: number, spacing: number): ReactNode[] {
  return blocks.map((block, i) => (
    // A Fragment, not a wrapper element: every block here is block-level, and a `<span>`
    // around a `<table>` is markup Outlook Windows unnests in its own way.
    <Fragment key={i}>
      {/* `Hr` carries its own spacing, so a Spacer in front would double the gap. */}
      {i > 0 && block.kind !== 'hr' ? <Spacer height={spacing} /> : null}
      {renderBlock(block, imageWidth, spacing)}
    </Fragment>
  ))
}

/** Render a Markdown string through the cascivo email primitives. */
export function Markdown({ children, spacing = 16, imageWidth = CONTENT_WIDTH }: MarkdownProps) {
  return <>{renderBlocks(parseMarkdown(children), imageWidth, spacing)}</>
}
