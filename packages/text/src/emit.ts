/**
 * `TextNode` tree → Markdown. The one place that decides what a rendered UI *means*.
 *
 * ## The rule this module follows
 *
 * **Machine mode is the accessibility tree, serialized.** Every decision here reads the same
 * thing a screen reader reads — semantic elements, ARIA roles and states, accessible names —
 * and nothing else. That is not a stylistic preference, it is the only signal available:
 * cascivo ships CSS Modules, so class names are build-time hashes (`_badge_1r5fv_83`) that
 * mean nothing to a reader and change on every build. The accessible layer is the one part
 * of a component's output that is already specified, already tested (`apg:check`,
 * `rtl:check`, the `enhancement-renders` sweep) and already stable API.
 *
 * It also makes the failure mode useful rather than mysterious: a component that serializes
 * to nothing is a component that says nothing to assistive technology either. Machine mode
 * inherits the catalog's a11y work, and inherits its gaps as visible bugs.
 *
 * Two consequences worth stating, because they look like oversights:
 *
 * - **Visually-hidden content is kept.** `sr-only` text is content a reader is meant to
 *   receive. This is how a chart arrives as a Markdown table: `ChartFrame` renders its
 *   `fallback` data table in a visually-hidden div, so passing `fallback` to a chart is what
 *   makes its series legible here. An SVG with no data table serializes to its accessible
 *   name, because that is genuinely all it offers.
 * - **Collapsed content is expanded.** A closed `<details>`, a `popover` that is not showing,
 *   a dialog with no `open` attribute — all are emitted with their content, annotated with
 *   their state. A human can click to reveal; a document cannot, and a reader that silently
 *   drops half a page is worse than one that says "this part is collapsed".
 */
import type { ResolvedOptions } from './options.ts'
import type { TextNode } from './tree.ts'
import { CLOSED, attr, hasAttr } from './tree.ts'

interface Ctx extends ResolvedOptions {
  /** id → node, for resolving `aria-labelledby`. */
  ids: Map<string, TextNode>
  /** Collected hrefs when `links: 'footnote'`. */
  footnotes: string[]
}

/** Structure carries no text of its own; `canvas` is decorative by contract in this catalog. */
const SKIP_TAGS = new Set([
  'base',
  'canvas',
  'col',
  'colgroup',
  'head',
  'link',
  'meta',
  'noscript',
  'script',
  'style',
  'template',
])

/** Tags that flow inside a line rather than starting a block of their own. */
const INLINE_TAGS = new Set([
  '#text',
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'button',
  'cite',
  'code',
  'data',
  'del',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'mark',
  'meter',
  'output',
  'picture',
  'progress',
  'q',
  's',
  'samp',
  'select',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'svg',
  'textarea',
  'time',
  'u',
  'var',
])

/** Elements whose accessible name a wrapping `<label>` supplies. */
const CONTROL_TAGS = new Set(['button', 'input', 'meter', 'progress', 'select', 'textarea'])

/**
 * Composite widgets whose children are one list of items, not a run of paragraphs. A tablist
 * printed as five blank-line-separated blocks is technically correct and reads like noise.
 */
const COMPOSITE_ROLES = new Set(['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree'])

/**
 * `data-state` values that say nothing. A machine reads `[button: Save (idle)]` as a state
 * worth knowing about; it is the FSM sitting at rest, which every control does when nothing
 * is happening. `selected` / `current` / `expanded` come from ARIA, which is where selection
 * is actually specified, so the visual `active`/`inactive` twins are dropped with them. A
 * toggle's `on`/`off` goes the same way: that is its value, already printed as `= checked`.
 */
const RESTING_STATES = new Set(['active', 'default', 'idle', 'inactive', 'off', 'on', 'rest'])

/** Landmark elements worth naming — but only when they carry an accessible name. */
const LANDMARKS = new Set(['aside', 'footer', 'form', 'header', 'main', 'nav'])

/** Serialize a parsed tree to Markdown. */
export function emit(root: TextNode, options: ResolvedOptions): string {
  const ctx: Ctx = { ...options, ids: new Map(), footnotes: [] }
  collectIds(root, ctx.ids)

  const body = childBlocks(root, ctx)
  if (ctx.footnotes.length > 0) {
    body.push(ctx.footnotes.map((href, index) => `[${index + 1}] ${href}`).join('\n'))
  }
  const joined = body
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return ctx.width > 0 ? wrapBlocks(joined, ctx.width) : joined
}

function collectIds(node: TextNode, ids: Map<string, TextNode>): void {
  const id = attr(node, 'id')
  if (id !== null && !ids.has(id)) ids.set(id, node)
  for (const child of node.children) collectIds(child, ids)
}

/**
 * Content excluded from the document. Note what is NOT here: `position:absolute` /
 * `clip-path` visually-hidden content is kept on purpose (see the module note).
 */
function skipped(node: TextNode): boolean {
  if (SKIP_TAGS.has(node.tag)) return true
  if (hasAttr(node, 'hidden') || hasAttr(node, 'inert')) return true
  if (attr(node, 'aria-hidden') === 'true') return true
  // The same escape hatch React Email offers, for content that only makes sense visually.
  if (hasAttr(node, 'data-skip-in-text')) return true
  if (node.tag === 'input' && attr(node, 'type') === 'hidden') return true
  const style = attr(node, 'style')
  return style !== null && /display\s*:\s*none/i.test(style)
}

/* ------------------------------------------------------------------ names */

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ')
}

/** Every bit of text under `node`, whitespace-collapsed. The basis of an accessible name. */
function textOf(node: TextNode): string {
  if (node.tag === '#text') return collapse(node.text)
  if (skipped(node)) return ''
  return collapse(node.children.map(textOf).join('')).trim()
}

/**
 * The accessible name, resolved the way the name computation does: `aria-label`, then
 * `aria-labelledby`, then the element's own content, then the attributes that stand in for
 * content on an empty element.
 *
 * A `<label for>` elsewhere in the document is deliberately NOT consulted: its text is part
 * of the document too, so it is already emitted next to the control. Reading it here would
 * print the same words twice.
 *
 * `useContent` is false for the controls whose content is their *value*, not their name — a
 * `<select>`'s own text is every option concatenated ("FreePro"), and a `<textarea>`'s is
 * what someone typed. Only a `<button>`, and a control wrapped in a `<label>`, is named by
 * what it contains.
 */
function accessibleName(node: TextNode, ctx: Ctx, useContent = true): string {
  const label = attr(node, 'aria-label')
  if (label !== null && label.trim() !== '') return collapse(label).trim()

  const labelledBy = attr(node, 'aria-labelledby')
  if (labelledBy !== null) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => {
        const target = ctx.ids.get(id)
        return target === undefined ? '' : textOf(target)
      })
      .filter((part) => part !== '')
    if (parts.length > 0) return parts.join(' ')
  }

  if (useContent) {
    const own = textOf(node)
    if (own !== '') return own
  }

  for (const fallback of ['title', 'alt', 'placeholder']) {
    const value = attr(node, fallback)
    if (value !== null && value.trim() !== '') return collapse(value).trim()
  }
  return ''
}

/* ----------------------------------------------------------------- states */

/**
 * The states a reader is told about, in a fixed order so output is stable.
 *
 * `data-state` is included raw because the authoring rules make it the escape hatch for
 * exactly the states CSS pseudo-classes cannot express — `loading`, `error`, `open` — which
 * is the same set a reader most needs and the one ARIA has no single attribute for.
 */
function states(node: TextNode): string[] {
  const found = new Set<string>()
  if (hasAttr(node, 'disabled') || attr(node, 'aria-disabled') === 'true') found.add('disabled')
  if (hasAttr(node, 'readonly')) found.add('readonly')
  if (hasAttr(node, 'required') || attr(node, 'aria-required') === 'true') found.add('required')
  if (attr(node, 'aria-invalid') === 'true') found.add('invalid')
  if (attr(node, 'aria-selected') === 'true') found.add('selected')
  if (attr(node, 'aria-pressed') === 'true') found.add('pressed')
  const current = attr(node, 'aria-current')
  if (current !== null && current !== 'false') found.add('current')
  const expanded = attr(node, 'aria-expanded')
  if (expanded === 'true') found.add('expanded')
  if (expanded === 'false') found.add('collapsed')
  const state = attr(node, 'data-state')
  if (state !== null) {
    const trimmed = collapse(state).trim()
    if (trimmed !== '' && !RESTING_STATES.has(trimmed)) found.add(trimmed)
  }
  return [...found]
}

function suffix(node: TextNode): string {
  const list = states(node)
  return list.length === 0 ? '' : ` (${list.join(', ')})`
}

/** `[kind: name = value (state)]` — the one grammar every affordance is printed in. */
function annotation(kind: string, name: string, value: string | null, node: TextNode): string {
  const head = name === '' ? kind : `${kind}: ${name}`
  const body = value === null ? head : `${head} = ${value}`
  return `[${body}${suffix(node)}]`
}

/* --------------------------------------------------------------- controls */

function selectedOptionLabel(node: TextNode): string | null {
  const options: TextNode[] = []
  const walk = (current: TextNode): void => {
    if (current.tag === 'option') options.push(current)
    for (const child of current.children) walk(child)
  }
  walk(node)
  // The live-DOM adapter writes the current value onto the node; the HTML path falls back
  // to the `selected` attribute, which is all a server-rendered <select> carries.
  const value = attr(node, 'value')
  const byValue =
    value === null
      ? undefined
      : options.find((option) => (attr(option, 'value') ?? textOf(option)) === value)
  const marked = options.find((option) => hasAttr(option, 'selected'))
  const chosen = byValue ?? marked ?? options[0]
  // `null` rather than `''` so an empty select prints `[select: Plan]` — `= ` with nothing
  // after it reads like a value that failed to render.
  return chosen === undefined ? null : textOf(chosen)
}

function percent(node: TextNode): string | null {
  const text = attr(node, 'aria-valuetext')
  if (text !== null && text.trim() !== '') return collapse(text).trim()
  const now = Number(attr(node, 'aria-valuenow') ?? attr(node, 'value'))
  const max = Number(attr(node, 'aria-valuemax') ?? attr(node, 'max') ?? 100)
  if (!Number.isFinite(now)) return null
  if (!Number.isFinite(max) || max <= 0) return String(now)
  return `${Math.round((now / max) * 100)}%`
}

/** The control a `<label>` wraps, if any. */
function wrappedControl(node: TextNode): TextNode | null {
  for (const child of node.children) {
    if (CONTROL_TAGS.has(child.tag)) return child
    const nested = wrappedControl(child)
    if (nested !== null) return nested
  }
  return null
}

/**
 * An interactive element, printed as what it is and what it currently holds.
 *
 * With `annotate: false` a control keeps only its label — a button still says "Save",
 * because that word is part of the page; a text field contributes nothing, because without
 * the annotation there is no way to tell its value from prose.
 */
function control(node: TextNode, ctx: Ctx, nameOverride?: string): string {
  const isButton = node.tag === 'button'
  const name = nameOverride ?? accessibleName(node, ctx, isButton)
  if (!ctx.annotate) return isButton ? name : ''

  if (node.tag === 'button') return annotation('button', name, null, node)
  if (node.tag === 'textarea')
    return annotation('textarea', name, `"${attr(node, 'value') ?? textOf(node)}"`, node)
  if (node.tag === 'select') return annotation('select', name, selectedOptionLabel(node), node)
  if (node.tag === 'progress' || node.tag === 'meter') {
    return annotation(node.tag, name, percent(node), node)
  }

  const type = (attr(node, 'type') ?? 'text').toLowerCase()
  if (type === 'checkbox' || type === 'radio') {
    // A tri-state checkbox is neither checked nor unchecked, and saying either is wrong —
    // the live-DOM adapter maps `indeterminate` here.
    const ariaChecked = attr(node, 'aria-checked')
    const checked = hasAttr(node, 'checked') || ariaChecked === 'true'
    const value = ariaChecked === 'mixed' ? 'mixed' : checked ? 'checked' : 'unchecked'
    return annotation(type, name, value, node)
  }
  if (type === 'submit' || type === 'button' || type === 'reset') {
    // `value` is this element's label, the one place it is a name rather than content.
    return annotation('button', name === '' ? (attr(node, 'value') ?? '') : name, null, node)
  }
  if (type === 'range') return annotation('slider', name, attr(node, 'value') ?? '', node)
  const kind = type === 'text' ? 'input' : `input ${type}`
  return annotation(kind, name, `"${attr(node, 'value') ?? ''}"`, node)
}

/**
 * Roles that mean something a tag does not. Returns `null` when the node is just a
 * container, which is the common case — a `<div role="tabpanel">` is its content.
 */
function roleAnnotation(node: TextNode, ctx: Ctx): string | null {
  const role = attr(node, 'role')
  if (role === null || !ctx.annotate) return null
  switch (role) {
    case 'tab':
    case 'menuitem':
    case 'treeitem':
      return annotation(role, accessibleName(node, ctx), null, node)
    case 'option':
      return annotation('option', accessibleName(node, ctx), null, node)
    case 'switch':
    case 'checkbox':
    case 'radio':
    case 'menuitemcheckbox':
    case 'menuitemradio': {
      const checked = attr(node, 'aria-checked')
      const value = checked === 'true' ? 'checked' : checked === 'mixed' ? 'mixed' : 'unchecked'
      return annotation(role, accessibleName(node, ctx), value, node)
    }
    case 'progressbar':
      return annotation('progress', accessibleName(node, ctx), percent(node), node)
    case 'img':
      // Delegated rather than named here: a chart's `<svg role="img">` carries its summary
      // in a `<desc>` child, and answering the role first dropped it on every chart.
      return graphic(node, ctx)
    default:
      return null
  }
}

/* ----------------------------------------------------------------- inline */

function wrapMarks(body: string, mark: string): string {
  const trimmed = body.trim()
  return trimmed === '' ? '' : `${mark}${trimmed}${mark}`
}

function link(node: TextNode, ctx: Ctx): string {
  const href = attr(node, 'href')
  const label = accessibleName(node, ctx)
  if (href === null || href === '') return label
  if (ctx.links === 'strip') return label
  if (label === '' || label === href) return href
  if (ctx.links === 'footnote') {
    ctx.footnotes.push(href)
    return `${label} [${ctx.footnotes.length}]`
  }
  return `[${label}](${href})`
}

/** A graphic is its accessible name, plus the `<desc>` a chart uses to summarise itself. */
function graphic(node: TextNode, ctx: Ctx): string {
  const title = node.children.find((child) => child.tag === 'title')
  const titled = title === undefined ? '' : textOf(title)
  const name = titled === '' ? accessibleName(node, ctx, false) : titled
  if (name.trim() === '') return ''
  const desc = node.children.find((child) => child.tag === 'desc')
  const detail = desc === undefined ? '' : textOf(desc)
  const label = `![${collapse(name).trim()}]`
  return detail === '' ? label : `${label} ${detail}`
}

function inline(node: TextNode, ctx: Ctx): string {
  if (skipped(node)) return ''
  // A role outranks the tag: `<button role="tab">` is a tab, and printing it as a button
  // loses the one thing a reader needs — which of the tabs is selected.
  const role = roleAnnotation(node, ctx)
  if (role !== null) return role
  switch (node.tag) {
    case 'label': {
      // A wrapping label IS the control's accessible name. Printing both gives the words
      // twice; printing neither loses the name entirely on a checkbox with no aria-label.
      const wrapped = wrappedControl(node)
      return wrapped === null ? childInline(node, ctx) : control(wrapped, ctx, textOf(node))
    }
    case '#text':
      return collapse(node.text)
    case 'br':
      return '\n'
    case 'a':
      return link(node, ctx)
    case 'img': {
      const alt = attr(node, 'alt') ?? ''
      const src = attr(node, 'src') ?? ''
      // A decorative image declares itself with an empty alt; honour that.
      return alt === '' ? '' : `![${alt}](${src})`
    }
    case 'svg':
      return graphic(node, ctx)
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
    case 'progress':
    case 'meter':
      return control(node, ctx)
    case 'strong':
    case 'b':
      return wrapMarks(childInline(node, ctx), '**')
    case 'em':
    case 'i':
      return wrapMarks(childInline(node, ctx), '_')
    case 'code':
    case 'kbd':
    case 'samp':
      return wrapMarks(childInline(node, ctx), '`')
    case 'del':
    case 's':
      return wrapMarks(childInline(node, ctx), '~~')
    default:
      return childInline(node, ctx)
  }
}

/**
 * Join two inline chunks, inserting the space neither carries.
 *
 * Two cases, and the second is the one that keeps being missed. An annotation is
 * punctuation-shaped and markup butts it straight against its label (`Email<input>` →
 * `Email[input = "…"]`). And two sibling ELEMENTS are two boxes: `<span>+12.5%</span>
 * <span>vs last month</span>` has no whitespace anywhere in the markup because the space a
 * reader sees is `gap` in the stylesheet — a fact no serializer can read, and one that
 * concatenation renders as `+12.5%vs last month`.
 *
 * So an element boundary is treated as a word boundary, guarded against the case where it
 * genuinely is not one: a chunk opening with punctuation (`<span>12</span><span>%</span>`)
 * is the same word continuing. Both halves of the walk go through here so the rule cannot
 * hold in one and not the other, which is how the second case survived a fix to the first.
 */
function appendInline(buffer: string, chunk: string, boundary: boolean): string {
  if (buffer === '' || chunk === '') return buffer + chunk
  if (/\s$/.test(buffer) || /^\s/.test(chunk)) return buffer + chunk
  const abuts = boundary || /^!?\[/.test(chunk) || buffer.endsWith(']')
  if (abuts && !/^[,.;:!?%)\]}]/.test(chunk) && !/[([{]$/.test(buffer)) return `${buffer} ${chunk}`
  return buffer + chunk
}

function childInline(node: TextNode, ctx: Ctx): string {
  let out = ''
  let afterElement = false
  for (const child of node.children) {
    const chunk = inline(child, ctx)
    const isElement = child.tag !== '#text'
    out = appendInline(out, chunk, afterElement && isElement)
    if (chunk !== '') afterElement = isElement
  }
  return out
}

/* ----------------------------------------------------------------- blocks */

/**
 * Group a node's children into blocks: runs of inline children merge into one paragraph,
 * block children contribute their own. This is what keeps `<div>Saved <strong>3</strong>
 * items<p>…</p></div>` from collapsing into one run of words.
 */
function childBlocks(node: TextNode, ctx: Ctx): string[] {
  const out: string[] = []
  let buffer = ''
  let afterElement = false
  const flush = (): void => {
    const done = buffer.trim()
    if (done !== '') out.push(done)
    buffer = ''
    afterElement = false
  }
  for (const child of node.children) {
    if (skipped(child)) continue
    // An annotated affordance is a discrete thing, so it never merges into a neighbour's
    // line — `[tab: A][tab: B]` is the shape this avoids.
    if (INLINE_TAGS.has(child.tag) && roleAnnotation(child, ctx) === null) {
      const chunk = inline(child, ctx)
      const isElement = child.tag !== '#text'
      buffer = appendInline(buffer, chunk, afterElement && isElement)
      if (chunk !== '') afterElement = isElement
      continue
    }
    flush()
    out.push(...blocks(child, ctx))
  }
  flush()
  return out
}

function quote(lines: string[]): string {
  return lines
    .join('\n\n')
    .split('\n')
    .map((line) => (line === '' ? '>' : `> ${line}`))
    .join('\n')
}

function list(node: TextNode, ctx: Ctx): string {
  const ordered = node.tag === 'ol'
  const start = Number(attr(node, 'start') ?? '1')
  let index = Number.isFinite(start) ? start : 1
  const items: string[] = []
  for (const child of node.children) {
    if (child.tag !== 'li' || skipped(child)) continue
    const marker = ordered ? `${index++}. ` : '- '
    const body = childBlocks(child, ctx).join('\n')
    if (body === '') continue
    items.push(
      body
        .split('\n')
        .map((line, position) =>
          position === 0 ? marker + line : ' '.repeat(marker.length) + line,
        )
        .join('\n'),
    )
  }
  return items.join('\n')
}

function cellText(cell: TextNode, ctx: Ctx): string {
  // A newline inside a cell would end the row; a pipe would open a new column.
  return childBlocks(cell, ctx).join(' ').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()
}

function table(node: TextNode, ctx: Ctx): string {
  const rows: string[][] = []
  const walk = (current: TextNode): void => {
    if (skipped(current)) return
    if (current.tag === 'tr') {
      const cells = current.children
        .filter((cell) => (cell.tag === 'td' || cell.tag === 'th') && !skipped(cell))
        .map((cell) => cellText(cell, ctx))
      if (cells.length > 0) rows.push(cells)
      return
    }
    for (const child of current.children) walk(child)
  }
  walk(node)
  if (rows.length === 0) return ''

  const width = Math.max(...rows.map((row) => row.length))
  const pad = (row: string[]): string =>
    `| ${Array.from({ length: width }, (_, i) => row[i] ?? '').join(' | ')} |`

  const caption = node.children.find((child) => child.tag === 'caption')
  const header = rows[0] ?? []
  const lines = [pad(header), `| ${Array.from({ length: width }, () => '---').join(' | ')} |`]
  for (const row of rows.slice(1)) lines.push(pad(row))
  const body = lines.join('\n')
  return caption === undefined ? body : `${textOf(caption)}\n\n${body}`
}

function fence(node: TextNode): string {
  const language = attr(node, 'data-language') ?? ''
  const body = rawText(node).replace(/\n+$/, '')
  return `\`\`\`${language}\n${body}\n\`\`\``
}

/** Text with whitespace intact — `<pre>` is the one place it carries meaning. */
function rawText(node: TextNode): string {
  if (node.tag === '#text') return node.text
  if (skipped(node)) return ''
  return node.children.map(rawText).join('')
}

function heading(node: TextNode, ctx: Ctx): string {
  const level = Number(node.tag.slice(1))
  const body = childInline(node, ctx).trim()
  return body === '' ? '' : `${'#'.repeat(level)} ${body}`
}

function disclosure(node: TextNode, ctx: Ctx): string[] {
  const summary = node.children.find((child) => child.tag === 'summary')
  const open = hasAttr(node, 'open')
  const rest = node.children.filter((child) => child !== summary)
  const body = childBlocks({ ...node, children: rest }, ctx)
  if (summary === undefined) return body
  const label = childInline(summary, ctx).trim()
  const head = ctx.annotate ? `${label} [${open ? 'expanded' : 'collapsed'}]` : label
  return [head, ...body]
}

/**
 * A dialog, with its state only when the state is actually knowable.
 *
 * `Modal` opens by calling `showModal()`, so an OPEN modal's server HTML carries no `open`
 * attribute — nothing distinguishes it from a closed one. Printing `(closed)` there is not a
 * conservative default, it is a false statement about the UI, and an agent has no way to
 * tell it from a true one. The live-DOM adapter can prove the negative (the property is
 * there to read) and marks it; the HTML path says nothing and means nothing.
 */
function dialog(node: TextNode, ctx: Ctx): string[] {
  const body = childBlocks(node, ctx)
  if (!ctx.annotate) return body
  const state =
    hasAttr(node, 'open') || attr(node, 'data-state') === 'open'
      ? ' (open)'
      : hasAttr(node, CLOSED) || attr(node, 'data-state') === 'closed'
        ? ' (closed)'
        : ''
  const name = attr(node, 'aria-label') ?? labelledByText(node, ctx)
  const head = name === '' ? 'dialog' : `dialog: ${name}`
  return [`[${head}${state}]`, ...body]
}

function labelledByText(node: TextNode, ctx: Ctx): string {
  const labelledBy = attr(node, 'aria-labelledby')
  if (labelledBy === null) return ''
  const target = ctx.ids.get(labelledBy.split(/\s+/)[0] ?? '')
  return target === undefined ? '' : textOf(target)
}

function landmark(node: TextNode, ctx: Ctx): string[] {
  const body = childBlocks(node, ctx)
  if (!ctx.annotate) return body
  // Unnamed landmarks are structure, not information — `[main]` above every page's content
  // is noise. A named one ("Breadcrumb", "Account") tells a reader which of several it is.
  const name = attr(node, 'aria-label') ?? labelledByText(node, ctx)
  return name === '' ? body : [`[${node.tag}: ${collapse(name).trim()}]`, ...body]
}

function blocks(node: TextNode, ctx: Ctx): string[] {
  if (skipped(node)) return []

  const role = roleAnnotation(node, ctx)
  if (role !== null) return [role]
  const roleName = attr(node, 'role')
  if (roleName !== null && COMPOSITE_ROLES.has(roleName)) {
    const items = childBlocks(node, ctx)
    return items.length === 0 ? [] : [items.join('\n')]
  }
  if (roleName === 'separator') return ['---']
  if (roleName === 'alert' || roleName === 'status') {
    // The title and the body are separate blocks and stay that way — running them together
    // reads as one sentence that was never written ("Payment failed Your card was declined").
    const body = childBlocks(node, ctx)
    const first = body[0] === undefined ? `[${roleName}]` : `[${roleName}] ${body[0]}`
    return [quote([first, ...body.slice(1)])]
  }
  if (roleName === 'dialog' || roleName === 'alertdialog') return dialog(node, ctx)

  switch (node.tag) {
    case '#text': {
      const body = collapse(node.text).trim()
      return body === '' ? [] : [body]
    }
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const body = heading(node, ctx)
      return body === '' ? [] : [body]
    }
    case 'hr':
      return ['---']
    case 'p':
    case 'figcaption':
    case 'dt':
    case 'dd':
    case 'caption':
    case 'summary': {
      const body = childInline(node, ctx).trim()
      return body === '' ? [] : [body]
    }
    case 'ul':
    case 'ol': {
      const body = list(node, ctx)
      return body === '' ? [] : [body]
    }
    case 'table': {
      const body = table(node, ctx)
      return body === '' ? [] : [body]
    }
    case 'blockquote': {
      const body = childBlocks(node, ctx)
      return body.length === 0 ? [] : [quote(body)]
    }
    case 'pre':
      return [fence(node)]
    case 'details':
      return disclosure(node, ctx)
    case 'dialog':
      return dialog(node, ctx)
    default:
      if (LANDMARKS.has(node.tag)) return landmark(node, ctx)
      return childBlocks(node, ctx)
  }
}

/* ---------------------------------------------------------------- wrapping */

/** Greedy wrap, never breaking a word. A long URL is left over-long on purpose. */
function wrapLine(line: string, width: number): string {
  if (line.length <= width) return line
  const out: string[] = []
  let current = ''
  for (const word of line.split(' ')) {
    if (current !== '' && current.length + 1 + word.length > width) {
      out.push(current)
      current = word
    } else {
      current = current === '' ? word : `${current} ${word}`
    }
  }
  if (current !== '') out.push(current)
  return out.join('\n')
}

/** Structured blocks keep their shape: wrapping a table row or a list item breaks it. */
function wrapBlocks(body: string, width: number): string {
  return body
    .split('\n\n')
    .map((block) =>
      block.startsWith('|') || block.startsWith('```') || /^(\s*[-*]|\s*\d+\.)\s/.test(block)
        ? block
        : block
            .split('\n')
            .map((line) => wrapLine(line, width))
            .join('\n'),
    )
    .join('\n\n')
}
