/**
 * Builds the `.llms/` payload for `@cascivo/docspack` — cascivo's documentation in the
 * [docspack](https://docspack.dev) package format, so an agent can `docspack sync` once and
 * then `docspack ask "how do I make a destructive button"` offline, against the versions its
 * lockfile actually installed.
 *
 * ## Why a custom chunker rather than `docspack build --from ./docs`
 *
 * docspack's generic builder splits a document at every `##`. That is right for prose, and
 * wrong for cascivo's generated reference pages, whose `##` headings are *fields* rather than
 * questions: `Category` is one line, `Sizes` is three, and 209 references each carrying a
 * near-identical `Sizes` section produce hundreds of chunks that `docspack doctor` rejects as
 * `chunk-too-small` and `duplicate-chunk`. So sections are packed greedily up to a token
 * budget and only split when a single one exceeds it — one component is normally one chunk.
 *
 * The other reason is metadata. The generic builder can only mine tags out of heading words
 * and entities out of inline code. cascivo already knows, from `registry.json`, a component's
 * category, its search tags, its export name and its props — so those are attached directly,
 * which is what makes a query like "collapsible sections" reach Accordion.
 *
 * Everything else is deliberately the real thing: token estimation, the chunk-id grammar, the
 * `<!-- docspack: from … -->` provenance line and manifest serialization all come from the
 * `docspack` package itself, so this file cannot drift from the format it targets.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { CHUNKS_DIR, type ChunkSpec, estimateTokens } from 'docspack'

/** Canonical web home of every chunk, recorded as its provenance. */
const SITE = 'https://cascivo.com'

/**
 * Target size for one chunk.
 *
 * Measured, not guessed — `payload.test.ts` runs a 40-question retrieval eval through the real
 * index, and top-3 coverage over 500/650/800/1000 came out 33/34/31/31. Retrieval prefers small
 * chunks (bm25 normalizes for length) while an answer prefers large ones (the cap is 3 chunks or
 * 3000 tokens, so 650 fills about half of it). 650 is the top of the plateau: best coverage, and
 * ~1450 tokens of context per answer instead of the 1165 that 500 returns.
 */
export const MAX_CHUNK_TOKENS = 650

/**
 * Below this a piece is not worth a chunk of its own — `docspack doctor` calls anything under 30
 * tokens "too small to answer anything", and a lone `###` heading is exactly that. Small pieces
 * are carried into their neighbour instead.
 */
const MIN_PIECE_TOKENS = 120

/**
 * Sections of `context/<name>.md` that `llms/<name>.md` does not already carry. The rest
 * (`Props`, `Tokens`, `Examples`) is the same table twice — shipping both would waste the
 * response budget on repetition and trip `doctor`'s duplicate detection. `AI context prompt`
 * is excluded too: it is a prompt to paste, near-identical across 197 components, and it
 * answers no question an agent would ask.
 */
const CONTEXT_SECTIONS = new Set([
  'When to use',
  'When NOT to use',
  'Anti-patterns',
  'Related components',
  'Accessibility rationale',
  'Boundaries',
])

/**
 * Catalogue listings that re-state, in one table, what every per-component chunk already says.
 * A retrieval index is not a document: shipping both means an index row and the reference it
 * points at compete for the same query, and the row always loses while still costing budget.
 * `docs/components.md` is that table; `llms.txt` carries two more of them.
 */
const EXCLUDED_GUIDES = new Set(['components'])
const INDEX_SECTION = /^Component (index|intent summaries)\b/

export interface PayloadFile {
  /** Path relative to `.llms/`. */
  readonly path: string
  readonly contents: string
}

export interface Payload {
  readonly manifest: { name: string; version: string; chunks: ChunkSpec[] }
  readonly files: PayloadFile[]
  /** The package-root `llms.txt` table of contents. */
  readonly llmsTxt: string
}

interface RegistryEntry {
  name: string
  type: string
  description?: string
  category?: string
  tags?: string[]
  meta?: { name?: string; props?: { name: string }[]; variants?: string[]; states?: string[] }
}

interface Registry {
  version: string
  components: RegistryEntry[]
  blocks?: RegistryEntry[]
  templates?: RegistryEntry[]
}

/** One source document, before it is split into chunks. */
interface Doc {
  /** Slug base for chunk ids; unique across the payload. */
  readonly id: string
  readonly title: string
  /** Canonical URL, written into each chunk as its provenance. */
  readonly origin: string
  /** One line prepended to every chunk so a fragment still says what it belongs to. */
  readonly lead: string
  readonly tags: readonly string[]
  readonly entities: readonly string[]
  readonly body: string
}

interface Section {
  readonly heading: string
  readonly body: string
}

// ---------------------------------------------------------------------------
// Markdown splitting
// ---------------------------------------------------------------------------

/** Line indexes that sit inside a fenced code block, so a `## ` inside one is not a heading. */
function fencedLines(lines: readonly string[]): boolean[] {
  const inFence: boolean[] = []
  let fence: string | null = null
  for (const line of lines) {
    const match = /^\s*(```+|~~~+)/.exec(line)
    if (fence === null && match?.[1] !== undefined) {
      fence = match[1]
      inFence.push(true)
      continue
    }
    if (fence !== null && match?.[1] !== undefined && match[1].startsWith(fence[0] ?? '')) {
      fence = null
      inFence.push(true)
      continue
    }
    inFence.push(fence !== null)
  }
  return inFence
}

/** Splits markdown at ATX headings of `level`, returning the text before the first one too. */
function splitAtLevel(markdown: string, level: number): { intro: string; sections: Section[] } {
  const lines = markdown.split('\n')
  const fenced = fencedLines(lines)
  const marker = `${'#'.repeat(level)} `

  const intro: string[] = []
  const sections: Section[] = []
  let current: { heading: string; body: string[] } | null = null

  for (const [index, line] of lines.entries()) {
    if (!fenced[index] && line.startsWith(marker)) {
      if (current !== null)
        sections.push({ heading: current.heading, body: current.body.join('\n').trim() })
      current = { heading: line.slice(marker.length).trim(), body: [] }
      continue
    }
    if (current === null) intro.push(line)
    else current.body.push(line)
  }
  if (current !== null)
    sections.push({ heading: current.heading, body: current.body.join('\n').trim() })

  return { intro: intro.join('\n').trim(), sections }
}

/** True for the `| --- | --- |` rule directly under a markdown table's header row. */
const TABLE_RULE = /^\s*\|?[\s:|-]+\|[\s:|-]*$/

/**
 * Splits a block that offers no blank-line boundary — a 200-row props table, or the component
 * index, which is one table and nothing else. Splitting is per line, and a table's header rows
 * are repeated on every piece so each one is still a readable table rather than a run of
 * anonymous cells.
 */
function splitLines(body: string, maxTokens: number): string[] {
  const lines = body.split('\n')
  const header =
    lines.length > 2 &&
    lines[0]?.trimStart().startsWith('|') === true &&
    TABLE_RULE.test(lines[1] ?? '')
      ? lines.slice(0, 2)
      : []

  const parts: string[] = []
  let buffer: string[] = []
  const flush = (): void => {
    if (buffer.length > 0) parts.push([...header, ...buffer].join('\n'))
    buffer = []
  }

  for (const line of lines.slice(header.length)) {
    if (buffer.length > 0 && estimateTokens([...header, ...buffer, line].join('\n')) > maxTokens) {
      flush()
    }
    buffer.push(line)
  }
  flush()

  return parts
}

/**
 * Splits a body into pieces that fit the budget: paragraphs, with any single oversized
 * paragraph broken down further by line, then greedily repacked so no piece is needlessly
 * small.
 */
function splitBody(body: string, maxTokens: number): string[] {
  const units = body
    .split(/\n{2,}/)
    .flatMap((paragraph) =>
      estimateTokens(paragraph) > maxTokens ? splitLines(paragraph, maxTokens) : [paragraph],
    )
    .filter((unit) => unit.trim().length > 0)

  const parts: string[] = []
  let buffer: string[] = []
  for (const unit of units) {
    const over = buffer.length > 0 && estimateTokens([...buffer, unit].join('\n\n')) > maxTokens
    // A buffer holding only a heading is not worth a chunk of its own: carry it into the next
    // piece instead, which overshoots the budget by at most MIN_PIECE_TOKENS.
    if (over && estimateTokens(buffer.join('\n\n')) >= MIN_PIECE_TOKENS) {
      parts.push(buffer.join('\n\n'))
      buffer = []
    }
    buffer.push(unit)
  }
  if (buffer.length > 0) parts.push(buffer.join('\n\n'))
  return parts
}

/** Renders one section back to markdown. A headingless section is the text above the first `##`. */
function render(section: Section): string {
  if (section.heading.length === 0) return section.body
  return section.body.length > 0
    ? `## ${section.heading}\n\n${section.body}`
    : `## ${section.heading}`
}

/**
 * A single section that busts the budget on its own: split it at `###`, then by the rules
 * above, keeping the section heading on every piece so the fragment stays attributable.
 */
function explode(section: Section, maxTokens: number): Section[] {
  const { intro, sections: deeper } = splitAtLevel(section.body, 3)
  const pieces: string[] =
    deeper.length === 0
      ? splitBody(section.body, maxTokens)
      : splitBody(
          [intro, ...deeper.map((part) => `### ${part.heading}\n\n${part.body}`.trim())]
            .filter((part) => part.length > 0)
            .join('\n\n'),
          maxTokens,
        )

  return pieces
    .filter((piece) => piece.trim().length > 0)
    .map((body, index) => ({
      heading: index === 0 ? section.heading : `${section.heading} (${index + 1})`,
      body,
    }))
}

/**
 * Packs `##` sections greedily into groups no larger than the budget. A group is one chunk,
 * named after its first section — so Button's twelve one-line fields become two retrievable
 * chunks rather than twelve unanswerable ones.
 */
function pack(sections: readonly Section[], maxTokens: number, overhead: number): Section[][] {
  const groups: Section[][] = []
  let buffer: Section[] = []
  let size = overhead

  const flush = (): void => {
    if (buffer.length > 0) groups.push(buffer)
    buffer = []
    size = overhead
  }

  for (const section of sections) {
    const cost = estimateTokens(render(section))
    if (cost + overhead > maxTokens) {
      flush()
      for (const piece of explode(section, maxTokens - overhead)) groups.push([piece])
      continue
    }
    if (buffer.length > 0 && size + cost > maxTokens) flush()
    buffer.push(section)
    size += cost
  }
  flush()

  return groups
}

// ---------------------------------------------------------------------------
// Tags and entities
// ---------------------------------------------------------------------------

/**
 * Function words that carry no topic. A section heading is a good tag — "Switching themes at
 * runtime" — but tags are weighted 3× against prose, so the "how"/"to"/"use" it drags in scores
 * as loudly as the word that identifies the chunk. That is not hypothetical: with these left in,
 * "how do I render a line chart" returned the overview's "How to use it" three times and never
 * reached LineChart.
 */
const STOPWORDS = new Set(
  `about all and any are can for from has how into its more not now one only other out over own
   the their them then there these this those use using via was were what when where which why
   will with you your`.split(/\s+/),
)

/** docspack's own tag normalization — lowercase words of 2+ characters, capped at 24 — minus noise. */
function uniqueWords(inputs: readonly string[]): string[] {
  const words = new Set<string>()
  for (const input of inputs) {
    for (const word of input.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? []) {
      if (!STOPWORDS.has(word)) words.add(word)
    }
  }
  return [...words].slice(0, 24)
}

/** A member access in inline code, e.g. `Stripe.setApiKey`. */
const DOTTED_ENTITY = /`([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)\(?\)?`/g
/** An inline-code token that is an identifier on its own: `TwoColumn`, `useSignal`, `text-accent`. */
const BARE_ENTITY =
  /`([A-Za-z][a-z0-9]*(?:[A-Z][A-Za-z0-9]*)+|[a-z][a-z0-9]*(?:-[a-z0-9]+)+)\(?\)?`/g

const MAX_ENTITIES = 20

function matchAll(text: string, pattern: RegExp): string[] {
  const found: string[] = []
  for (const match of text.matchAll(pattern)) if (match[1] !== undefined) found.push(match[1])
  return found
}

/**
 * Identifiers a chunk names. Hyphenated names go last: a reference page enumerates dozens of
 * `--cascivo-*` token variants, and letting those fill the cap would drop the component the
 * page is actually about.
 */
function entitiesIn(body: string, seed: readonly string[]): string[] {
  const bare = matchAll(body, BARE_ENTITY)
  return [
    ...new Set([
      ...seed,
      ...matchAll(body, DOTTED_ENTITY),
      ...bare.filter((name) => !name.includes('-')),
      ...bare.filter((name) => name.includes('-')),
    ]),
  ].slice(0, MAX_ENTITIES)
}

function slugify(input: string, fallback: string): string {
  const slug = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return slug.length > 0 ? slug : fallback
}

function uniqueId(base: string, taken: Set<string>): string {
  let candidate = base
  let counter = 2
  while (taken.has(candidate)) {
    candidate = `${base}-${counter}`
    counter += 1
  }
  taken.add(candidate)
  return candidate
}

// ---------------------------------------------------------------------------
// Source documents
// ---------------------------------------------------------------------------

function markdownFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...markdownFiles(full))
    else if (entry.endsWith('.md')) out.push(full)
  }
  return out
}

/** Strips the "generated from …" HTML comment the guide mirror opens with. */
function stripLeadingComment(markdown: string): string {
  return markdown.replace(/^\s*<!--[\s\S]*?-->\s*/, '')
}

/**
 * Collapses the alignment padding in markdown tables. Every generated reference page pads its
 * cells into columns, and a token estimate is characters over four — so LineChart's 33-row props
 * table measured 4,094 tokens of which three quarters were spaces. Squeezing them is lossless
 * for the reader and takes the same table to 1,245, which is the difference between one coherent
 * chunk and sixteen slices that compete with each other for the same query.
 */
function compactTables(markdown: string): string {
  const lines = markdown.split('\n')
  const fenced = fencedLines(lines)
  return lines
    .map((line, index) =>
      !fenced[index] && line.trimStart().startsWith('|')
        ? line.replace(/[ \t]{2,}/g, ' ').replace(/-{4,}/g, '---')
        : line,
    )
    .join('\n')
}

/** Reads a source document and normalizes what only costs tokens. */
function readMarkdown(file: string): string {
  return compactTables(stripLeadingComment(readFileSync(file, 'utf8')))
}

function titleOf(markdown: string, fallback: string): string {
  const match = /^#\s+(.+?)\s*$/m.exec(markdown)
  return match?.[1]?.trim() ?? fallback
}

/** Everything after the `# Title` line. */
function afterTitle(markdown: string): string {
  const lines = markdown.split('\n')
  const index = lines.findIndex((line) => /^#\s+\S/.test(line))
  return index === -1
    ? markdown.trim()
    : lines
        .slice(index + 1)
        .join('\n')
        .trim()
}

/**
 * Registry entries keyed the way `apps/site/public/llms/` lays them out, so a doc file maps to
 * its manifest by path: `llms/button.md` → `button`, `llms/chart/area-chart.md` →
 * `chart/area-chart`. That is already how `registry.components` names them, and it is the only
 * key that survives `app-shell` existing as both a component and a page block.
 *
 * `registry.blocks` and `registry.templates` repeat some entries under a bare name; they are
 * added under their namespaced path only where the authoritative array has no entry.
 */
function indexRegistry(registry: Registry): Map<string, RegistryEntry> {
  const index = new Map<string, RegistryEntry>()
  for (const entry of registry.components) index.set(entry.name, entry)
  for (const [prefix, entries] of [
    ['block', registry.blocks ?? []],
    ['template', registry.templates ?? []],
  ] as const) {
    for (const entry of entries) {
      const key = entry.name.includes('/') ? entry.name : `${prefix}/${entry.name}`
      if (!index.has(key)) index.set(key, { ...entry, type: entry.type || prefix })
    }
  }
  return index
}

/**
 * The generated per-component references under `apps/site/public/llms/`, each enriched with the
 * intent sections of its `context/` twin.
 */
function referenceDocs(publicDir: string, registry: Registry): Doc[] {
  const llmsDir = join(publicDir, 'llms')
  const contextDir = join(publicDir, 'context')
  const byKey = indexRegistry(registry)
  const docs: Doc[] = []

  for (const file of markdownFiles(llmsDir)) {
    const rel = relative(llmsDir, file).replaceAll('\\', '/')
    const name = basename(rel, '.md')
    // The doc path IS the registry name — `chart/area-chart.md` documents `chart/area-chart`.
    const registryName = rel.replace(/\.md$/, '')
    const entry = byKey.get(registryName)

    const source = readMarkdown(file)
    const title = titleOf(source, name)
    const kind = entry?.type ?? 'component'

    const extra = contextSections(contextDir, name)
    const body = [afterTitle(source), extra].filter((part) => part.length > 0).join('\n\n')

    const exportName = entry?.meta?.name ?? title
    const props = (entry?.meta?.props ?? []).map((prop) => `${exportName}.${prop.name}`)

    docs.push({
      id: slugify(rel.replace(/\.md$/, ''), name),
      title,
      origin: `${SITE}/llms/${rel}`,
      lead: lead(
        kind,
        exportName,
        registryName,
        entry?.category,
        entry?.description,
        registry.version,
      ),
      // The index weights tags 3× over prose, and `uniqueWords` keeps only the first 24, so
      // order is ranking. Identity first, then what someone would actually name in a question:
      // a variant ("a destructive button") or a state ("a loading button").
      tags: [
        title,
        name,
        kind,
        entry?.category ?? '',
        ...(entry?.tags ?? []),
        ...(entry?.meta?.variants ?? []),
        ...(entry?.meta?.states ?? []),
      ],
      entities: [exportName, `${exportName}Props`, ...props],
      body,
    })
  }

  return docs
}

/**
 * The intent-only half of `context/<name>.md`, which the reference page does not carry. Context
 * files are flat, whatever subdirectory the reference itself lives in.
 */
function contextSections(contextDir: string, name: string): string {
  let source: string
  try {
    source = readMarkdown(join(contextDir, `${name}.md`))
  } catch {
    return ''
  }
  return splitAtLevel(source, 2)
    .sections.filter((section) => CONTEXT_SECTIONS.has(section.heading))
    .map(render)
    .join('\n\n')
}

/**
 * One line repeated at the top of every chunk. A chunk is retrieved alone, so a fragment of a
 * props table has to say on its own which component it belongs to, how to import it and which
 * registry version it describes — otherwise the agent has the answer and not the import.
 */
function lead(
  kind: string,
  exportName: string,
  registryName: string,
  category: string | undefined,
  description: string | undefined,
  version: string,
): string {
  const what = category === undefined ? kind : `${kind}, ${category}`
  const tail = description === undefined ? '' : ` — ${description}.`
  return `_cascivo \`${exportName}\` (${what})${tail} Import from \`@cascivo/react\`, or copy the source with \`npx cascivo add ${registryName}\`. cascivo registry v${version}._`
}

/** The hand-written concept guides mirrored to `apps/site/public/docs/`. */
function guideDocs(publicDir: string, version: string): Doc[] {
  const dir = join(publicDir, 'docs')
  return markdownFiles(dir)
    .filter((file) => !EXCLUDED_GUIDES.has(basename(file, '.md')))
    .map((file) => {
      const slug = basename(file, '.md')
      const source = readMarkdown(file)
      const title = titleOf(source, slug)
      return {
        id: slugify(`guide-${slug}`, `guide-${slug}`),
        title,
        origin: `${SITE}/docs/${slug}.md`,
        lead: `_cascivo guide: ${title}. cascivo registry v${version}._`,
        tags: ['guide', title, slug],
        entities: [],
        body: afterTitle(source),
      }
    })
}

/** `llms.txt` — install steps, the consumption paths, and the cross-cutting authoring rules. */
function overviewDoc(publicDir: string, version: string): Doc {
  const source = readMarkdown(join(publicDir, 'llms.txt'))
  const { intro, sections } = splitAtLevel(afterTitle(source), 2)
  const kept = sections.filter((section) => !INDEX_SECTION.test(section.heading))
  return {
    id: 'cascivo',
    title: 'cascivo',
    origin: `${SITE}/llms.txt`,
    lead: `_cascivo — the CSS-native, signal-driven, AI-first React design system. cascivo registry v${version}._`,
    tags: ['cascivo', 'overview', 'install', 'getting started', 'design system'],
    entities: ['@cascivo/react', '@cascivo/core'],
    body: [intro, ...kept.map(render)].filter((part) => part.length > 0).join('\n\n'),
  }
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function chunkDoc(
  doc: Doc,
  taken: Set<string>,
  maxTokens: number,
): {
  chunks: ChunkSpec[]
  files: PayloadFile[]
} {
  const { intro, sections } = splitAtLevel(doc.body, 2)
  // Every chunk repeats the title, provenance and lead; charge them to the budget up front.
  const overhead = estimateTokens(
    `# ${doc.title}\n\n<!-- docspack: from ${doc.origin} -->\n\n${doc.lead}\n`,
  )
  // The text above the first `##` is a section like any other, so it gets split and packed by
  // the same rules — `docs/components.md` is one 16k-token table with no headings at all.
  const groups = pack(
    [...(intro.length > 0 ? [{ heading: '', body: intro }] : []), ...sections],
    maxTokens,
    overhead,
  )

  const chunks: ChunkSpec[] = []
  const files: PayloadFile[] = []

  for (const [index, group] of groups.entries()) {
    const first = group.find((section) => section.heading.length > 0)?.heading
    const heading = index === 0 || first === undefined ? doc.title : `${doc.title} — ${first}`
    const id = uniqueId(
      index === 0 ? doc.id : slugify(`${doc.id}-${first ?? index + 1}`, `${doc.id}-${index + 1}`),
      taken,
    )
    const body = group
      .map((section) => (section.heading.length === 0 ? section.body : render(section)))
      .join('\n\n')
      .trim()
    const contents = `# ${heading}\n\n<!-- docspack: from ${doc.origin} -->\n\n${doc.lead}\n\n${body}\n`
    const file = `${CHUNKS_DIR}/${id}.md`

    files.push({ path: file, contents })
    chunks.push({
      id,
      file,
      tokens: estimateTokens(contents),
      tags: uniqueWords([...doc.tags, ...group.map((section) => section.heading)]),
      entities: entitiesIn(body, doc.entities),
    })
  }

  return { chunks, files }
}

export interface BuildPayloadOptions {
  /** Monorepo root — the directory holding `registry.json` and `apps/`. */
  readonly root: string
  readonly name: string
  readonly version: string
  readonly maxChunkTokens?: number
}

export function buildPayload(options: BuildPayloadOptions): Payload {
  const publicDir = join(options.root, 'apps', 'site', 'public')
  const registry = JSON.parse(readFileSync(join(options.root, 'registry.json'), 'utf8')) as Registry
  const maxTokens = options.maxChunkTokens ?? MAX_CHUNK_TOKENS

  const docs = [
    overviewDoc(publicDir, registry.version),
    ...guideDocs(publicDir, registry.version),
    ...referenceDocs(publicDir, registry),
  ]

  const taken = new Set<string>()
  const chunks: ChunkSpec[] = []
  const files: PayloadFile[] = []
  for (const doc of docs) {
    const built = chunkDoc(doc, taken, maxTokens)
    chunks.push(...built.chunks)
    files.push(...built.files)
  }

  return {
    manifest: { name: options.name, version: options.version, chunks },
    files,
    llmsTxt: renderLlmsTxt(options.name, options.version, registry.version, chunks),
  }
}

function renderLlmsTxt(
  name: string,
  version: string,
  registryVersion: string,
  chunks: readonly ChunkSpec[],
): string {
  const tokens = chunks.reduce((total, chunk) => total + chunk.tokens, 0)
  return `${[
    `# ${name}`,
    '',
    `> cascivo's documentation as a [docspack](https://docspack.dev) package: ${chunks.length} chunks,`,
    `> ~${tokens.toLocaleString('en-US')} tokens, describing cascivo registry v${registryVersion}.`,
    `> Install it, run \`docspack sync\`, and \`docspack ask\` answers offline from this payload.`,
    '',
    '## Use it',
    '',
    '```sh',
    `pnpm add -D ${name} docspack`,
    'npx docspack sync',
    'npx docspack ask "how do I theme a component"',
    '```',
    '',
    '## Chunks',
    '',
    ...chunks.map((chunk) => {
      const tags = chunk.tags.slice(0, 6).join(', ')
      return `- [${chunk.id}](.llms/${chunk.file})${tags.length > 0 ? `: ${tags}` : ''}`
    }),
    '',
    '## Also available',
    '',
    `- \`npx -y @cascivo/docs\` — the same documentation as plain files, no index needed`,
    `- \`@cascivo/mcp\` — the component registry over MCP`,
    `- https://cascivo.com/llms.txt — the web copy of the index (documents the latest release, not yours)`,
    '',
    `_Generated from cascivo registry v${registryVersion} for ${name}@${version}._`,
  ].join('\n')}\n`
}
