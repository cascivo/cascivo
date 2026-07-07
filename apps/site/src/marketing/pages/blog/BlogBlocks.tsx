import type { BlogBlock } from '../../../blog/types'
import { CodeBlock } from '../../../pages/components/CodeBlock'

/** Renders a post's content blocks — the runtime counterpart to renderBlogPostBody in vite.config.ts. */
export function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'p':
            // eslint-disable-next-line react/no-array-index-key
            return <p key={i}>{block.text}</p>
          case 'h2':
            // eslint-disable-next-line react/no-array-index-key
            return <h2 key={i}>{block.text}</h2>
          case 'ul':
            return (
              // eslint-disable-next-line react/no-array-index-key
              <ul key={i}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          case 'code':
            // eslint-disable-next-line react/no-array-index-key
            return <CodeBlock key={i} lang={block.lang} code={block.code} />
          case 'callout':
            // eslint-disable-next-line react/no-array-index-key
            return <blockquote key={i}>{block.text}</blockquote>
          case 'links':
            return (
              // eslint-disable-next-line react/no-array-index-key
              <ul key={i}>
                {block.items.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.text} →</a>
                  </li>
                ))}
              </ul>
            )
          default:
            return null
        }
      })}
    </>
  )
}
