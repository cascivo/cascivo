/**
 * A changeset must survive being pasted into a CHANGELOG and formatted.
 *
 * `.changeset/email-align-and-preview-theme.md` stranded the 2026-09-16 release. Its
 * prose was fine on its own; the damage appeared only after `changeset version` nested
 * the body under `- <commit>: ` in four CHANGELOGs. From there `vp check --fix` re-indented
 * the same paragraphs on EVERY run — 4 → 12 → 20 → 28 spaces, never converging — so
 * release.yml's "Verify generated docs are up to date" gate could not be satisfied by any
 * committed state, and `changeset publish` never ran.
 *
 * The trigger was an inline code span split across a line break:
 *
 *     ... the explicit declaration it won. So `<Column
 *     align="right">` full of a `Button` rendered hard left.
 *
 * A code span containing a newline breaks the formatter's list-item indent accounting, and
 * every block after it in that item drifts one pass further out.
 *
 * WHY THE OBVIOUS CHECK WOULD NOT HAVE CAUGHT IT: formatting `.changeset/*.md` directly is
 * a fixpoint for this exact file. At the top level of its own file the prose is unnested,
 * and the bug needs the list-item nesting that only `changeset version` adds. A guard that
 * formats the changeset where it sits passes, vacuously. So this reproduces the embedding
 * first — through changesets' own `getReleaseLine`, not a local imitation of it — and
 * formats THAT.
 *
 * WHAT IS ASSERTED is convergence (`fmt(fmt(x)) === fmt(x)`), not `fmt(x) === x`. The
 * release gate needs a committed state the formatter leaves alone; one exists if and only
 * if formatting converges. `getReleaseLine` also emits trailing whitespace on blank lines,
 * which the first pass always strips, so requiring the stricter form would fire on every
 * well-formed changeset. Measured over all 23 changesets in this repo's history:
 * convergence flags the one that broke the release and none of the other 22.
 */

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, describe, it } from 'node:test'

const REPO_ROOT = join(import.meta.dirname, '../..')
const CHANGESET_DIR = join(REPO_ROOT, '.changeset')

/**
 * The formatter the release gate runs. `vp` bundles its own oxfmt; the `oxfmt` in
 * node_modules/.bin is an IDE-only wrapper that formats nothing and exits 0, so reaching
 * for it here would make every file "converge" and this whole check pass vacuously.
 */
const VP = join(REPO_ROOT, 'node_modules/.bin/vp')

/** The changelog formatter this check reproduces. */
const SIMULATED_CHANGELOG = '@changesets/cli/changelog'

type Bump = 'major' | 'minor' | 'patch'
type Changeset = { file: string; summary: string; bump: Bump }

function pending(): Changeset[] {
  const out: Changeset[] = []
  for (const entry of readdirSync(CHANGESET_DIR)) {
    if (!entry.endsWith('.md') || entry === 'README.md') continue
    const source = readFileSync(join(CHANGESET_DIR, entry), 'utf8')
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source)
    if (!match) continue
    const [, frontmatter = '', body = ''] = match
    const bumps = [...frontmatter.matchAll(/:\s*(major|minor|patch)\s*$/gm)].map((m) => m[1])
    out.push({
      file: entry,
      summary: body.trim(),
      bump: (bumps.includes('major')
        ? 'major'
        : bumps.includes('minor')
          ? 'minor'
          : 'patch') as Bump,
    })
  }
  return out
}

const HEADING: Record<Bump, string> = {
  major: '### Major Changes',
  minor: '### Minor Changes',
  patch: '### Patch Changes',
}

/** The changeset as `changeset version` will write it into a package's CHANGELOG. */
async function asChangelog(changeset: Changeset): Promise<string> {
  const { default: changelog } = (await import(SIMULATED_CHANGELOG)) as {
    default: {
      getReleaseLine: (
        changeset: { summary: string; id: string; commit?: string; releases: unknown[] },
        type: Bump,
        options: unknown,
      ) => Promise<string>
    }
  }
  const line = await changelog.getReleaseLine(
    { summary: changeset.summary, id: 'guard', commit: 'abc1234', releases: [] },
    changeset.bump,
    null,
  )
  return `# @cascivo/example\n\n## 1.0.0\n\n${HEADING[changeset.bump]}\n\n${line}\n`
}

/** Format every `.md` in `dir` in place, exactly as `vp check --fix` would. */
function format(dir: string): void {
  execFileSync(VP, ['fmt', dir], { cwd: REPO_ROOT, stdio: 'ignore' })
}

/**
 * The formatted form, and the formatted form of that. Equal means a committed state the
 * release gate will leave alone exists.
 */
function formatTwice(docs: Map<string, string>): Map<string, [string, string]> {
  const dir = mkdtempSync(join(tmpdir(), 'cascivo-changeset-fmt-'))
  try {
    const names = new Map<string, string>()
    let index = 0
    for (const [key, doc] of docs) {
      const name = `${index++}.md`
      names.set(key, name)
      writeFileSync(join(dir, name), doc)
    }
    format(dir)
    const once = new Map([...names].map(([key, n]) => [key, readFileSync(join(dir, n), 'utf8')]))
    format(dir)
    const twice = new Map([...names].map(([key, n]) => [key, readFileSync(join(dir, n), 'utf8')]))
    return new Map(
      [...docs.keys()].map((key) => [key, [once.get(key) ?? '', twice.get(key) ?? '']]),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Line numbers in `body` where an inline code span runs across a line break. */
function splitCodeSpans(body: string): number[] {
  const withoutFences = body.replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1[^\n]*$/gm, (block) =>
    block.replace(/[^\n]/g, ' '),
  )
  const lines: number[] = []
  for (const match of withoutFences.matchAll(/(?<!`)(`+)(?!`)([^`]*?)(?<!`)\1(?!`)/g)) {
    if (match[2]?.includes('\n')) {
      lines.push(withoutFences.slice(0, match.index).split('\n').length)
    }
  }
  return lines
}

/** The first line where two formatting passes disagree, for the failure message. */
function firstDivergence(once: string, twice: string): string {
  const a = once.split('\n')
  const b = twice.split('\n')
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return `    pass 1: ${JSON.stringify(a[i] ?? '<end of file>')}\n    pass 2: ${JSON.stringify(b[i] ?? '<end of file>')}`
    }
  }
  return '    (no line differs)'
}

function explain(changeset: Changeset, once: string, twice: string): string {
  const split = splitCodeSpans(changeset.summary)
  const cause =
    split.length > 0
      ? `\n  An inline code span runs across a line break at .changeset/${changeset.file} line ` +
        `${split.join(', ')}. That is the known trigger: put the whole \`code span\` on one line.`
      : '\n  No split code span found, so this is a new shape. Reduce the summary until the ' +
        'divergence disappears and note what did it.'
  return (
    `.changeset/${changeset.file} does not survive being written into a CHANGELOG.\n` +
    `  Two formatting passes over the generated entry disagree, so no committed CHANGELOG ` +
    `can satisfy release.yml's drift gate and \`changeset publish\` will never run:\n` +
    firstDivergence(once, twice) +
    cause +
    '\n  See the head of scripts/checks/changeset-format.test.ts.'
  )
}

describe('changeset format — a changeset survives becoming a CHANGELOG entry', () => {
  const temp: string[] = []
  after(() => {
    for (const dir of temp) rmSync(dir, { recursive: true, force: true })
  })

  it('reproduces the changelog formatter the repo actually configures', () => {
    const config = JSON.parse(readFileSync(join(CHANGESET_DIR, 'config.json'), 'utf8')) as {
      changelog?: unknown
    }
    assert.equal(
      config.changelog,
      SIMULATED_CHANGELOG,
      `.changeset/config.json sets a different changelog formatter, so the entry this check ` +
        `builds is no longer the entry changesets writes and the check no longer proves ` +
        `anything. Update SIMULATED_CHANGELOG in scripts/checks/changeset-format.test.ts.`,
    )
  })

  it('the formatter this check runs is real', () => {
    // This guard is only worth its runtime if `vp fmt` actually reformats markdown in the
    // throwaway directory below. A formatter that silently does nothing — node_modules/.bin/
    // oxfmt is exactly that, an IDE-only shim that exits 0 having changed nothing — would make
    // every changeset "converge" and turn this file into a no-op that still reads like
    // coverage. So prove the formatter bites before trusting anything it says.
    assert.ok(existsSync(VP), `${VP} is missing — this check cannot format anything.`)
    const unformatted = '#  Canary\n\n\n*  a bullet   \n*  another\n'
    const [once] = formatTwice(new Map([['canary', unformatted]])).get('canary') ?? ['']
    assert.notEqual(
      once,
      unformatted,
      '`vp fmt` left deliberately mis-formatted markdown untouched, so it is not formatting ' +
        'the files this check writes. Every assertion below would pass vacuously.',
    )
  })

  it('every pending changeset converges under the formatter', async (t) => {
    const changesets = pending()
    if (changesets.length === 0) {
      t.skip('no pending changesets')
      return
    }
    const docs = new Map<string, string>()
    for (const changeset of changesets) docs.set(changeset.file, await asChangelog(changeset))
    const formatted = formatTwice(docs)

    const broken = changesets
      .filter((changeset) => {
        const [once, twice] = formatted.get(changeset.file) ?? ['', '']
        return once !== twice
      })
      .map((changeset) => {
        const [once, twice] = formatted.get(changeset.file) ?? ['', '']
        return explain(changeset, once, twice)
      })

    assert.deepEqual(broken, [], `\n\n${broken.join('\n\n')}\n`)
  })
})
