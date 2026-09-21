/**
 * HTML string → `TextNode` tree.
 *
 * Hand-written rather than taken from a parser dependency, for the reason
 * `packages/email/src/render/plaintext.ts` gives about its own regex work: the input is not
 * arbitrary HTML off the web, it is a React renderer's output — well-formed, every attribute
 * quoted, every non-void element closed. A spec-complete parser would be several hundred
 * kilobytes of tolerance for markup this package never receives, in a package that otherwise
 * has no runtime dependencies at all.
 *
 * What it does handle, because React really emits it: void elements, self-closing tags, raw-
 * text elements (`<script>`, `<style>`, `<textarea>`), comments, and the entity set React
 * escapes into (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#x27;`) plus numeric references.
 *
 * What it does NOT handle is markup that relies on implicit close tags (`<p>a<p>b`, a `<li>`
 * left open). An unclosed element nests its successors instead of ending — the output is
 * wrong, not a crash. If a caller ever needs to serialize hand-written HTML, parse it with a
 * real parser and hand the DOM to `elementToText` instead.
 */
import type { TextNode } from './tree.ts'
import { RAW_TEXT_TAGS, VOID_TAGS, element, text } from './tree.ts'

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** Decode the entity set a React renderer emits, plus numeric references. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith('#')) {
      const code =
        body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1))
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

const ATTR = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  ATTR.lastIndex = 0
  let match = ATTR.exec(source)
  while (match !== null) {
    const name = match[1]
    if (name !== undefined) {
      // A valueless attribute is a boolean one — `disabled` reads as present, value ''.
      const raw = match[2] ?? match[3] ?? match[4] ?? ''
      attrs[name.toLowerCase()] = decodeEntities(raw)
    }
    match = ATTR.exec(source)
  }
  return attrs
}

/** Parse `html` into a `#root` node whose children are the document's top-level nodes. */
export function parseHtml(html: string): TextNode {
  const root = element('#root')
  const stack: TextNode[] = [root]
  let index = 0

  const top = (): TextNode => stack[stack.length - 1] ?? root

  while (index < html.length) {
    const next = html.indexOf('<', index)
    if (next === -1) {
      appendText(top(), html.slice(index))
      break
    }
    if (next > index) appendText(top(), html.slice(index, next))

    if (html.startsWith('<!--', next)) {
      const end = html.indexOf('-->', next)
      index = end === -1 ? html.length : end + 3
      continue
    }
    // Doctypes and processing instructions carry nothing a reader wants.
    if (html.startsWith('<!', next) || html.startsWith('<?', next)) {
      const end = html.indexOf('>', next)
      index = end === -1 ? html.length : end + 1
      continue
    }

    const end = html.indexOf('>', next)
    if (end === -1) {
      appendText(top(), html.slice(next))
      break
    }
    const inner = html.slice(next + 1, end)
    index = end + 1

    if (inner.startsWith('/')) {
      const name = inner.slice(1).trim().toLowerCase()
      // Close the nearest matching ancestor; a stray close tag for an element that was
      // never opened is ignored rather than unwinding the whole stack.
      for (let depth = stack.length - 1; depth > 0; depth -= 1) {
        if (stack[depth]?.tag === name) {
          stack.length = depth
          break
        }
      }
      continue
    }

    const selfClosing = inner.endsWith('/')
    const body = selfClosing ? inner.slice(0, -1) : inner
    const space = body.search(/\s/)
    const tag = (space === -1 ? body : body.slice(0, space)).toLowerCase()
    if (tag === '') continue
    const node = element(tag, space === -1 ? {} : parseAttrs(body.slice(space)))
    top().children.push(node)

    if (selfClosing || VOID_TAGS.has(tag)) continue

    if (RAW_TEXT_TAGS.has(tag)) {
      const close = html.toLowerCase().indexOf(`</${tag}`, index)
      const raw = close === -1 ? html.slice(index) : html.slice(index, close)
      if (raw !== '') node.children.push(text(decodeEntities(raw)))
      index = close === -1 ? html.length : close
      continue
    }

    stack.push(node)
  }

  return root
}

function appendText(parent: TextNode, raw: string): void {
  if (raw === '') return
  parent.children.push(text(decodeEntities(raw)))
}
