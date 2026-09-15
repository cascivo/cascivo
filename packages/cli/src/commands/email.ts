/**
 * `cascivo email lint` — the conformance check, without the boilerplate.
 *
 * `lint()` is the most compelling thing in `@cascivo/email` and it cannot run out of the
 * box: it needs the Can I email support matrix, which the package deliberately does not
 * bundle (~483 KB of test data in every adopter's `node_modules`). The README says where to
 * fetch it, and every adopter then writes the same dozen lines — fetch, cache, index, lint,
 * decide an exit code. This is those lines, once.
 *
 * It lints **rendered HTML**, not templates. Rendering a `.tsx` would mean a compiler this
 * CLI has no business carrying, and every project already renders in its own build; piping
 * the output here costs nothing and keeps the command honest about what it checks — the
 * finished document, which is the only thing a client ever sees.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { stdin } from 'node:process'
import type { CanIEmailData, Feature, Finding } from '@cascivo/email'
import { flagValue, positionalArgs } from '../utils/args.js'

/** Upstream, and the URL the README and the preview both name. MIT, hteumeuleu/caniemail. */
const SOURCE = 'https://www.caniemail.com/api/data.json'

/**
 * Where a fetched copy is kept.
 *
 * In the temp directory rather than the project: it is a cache of somebody else's data, it
 * is large, and a stale copy is a correctness problem rather than a disk one — so it lives
 * somewhere that gets cleaned up, and `--refresh` exists for when it should not be trusted.
 */
const CACHE = join(tmpdir(), 'cascivo-caniemail.json')

/** A day. Long enough that a CI run does not re-download; short enough to notice a retest. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Load `@cascivo/email` from the caller's project.
 *
 * An optional peer, resolved at call time. Making it a real dependency would put the whole
 * email package into the download for `cascivo add button`; anyone who wants this command
 * has it installed already, and the failure below says so if they do not.
 *
 * `@cascivo/email` is a devDependency here purely so these types resolve — nothing in the
 * published bundle imports it except this line.
 */
async function loadEmail(): Promise<typeof import('@cascivo/email')> {
  try {
    return await import('@cascivo/email')
  } catch {
    throw new Error(
      'cascivo email lint needs @cascivo/email, which is not installed here.\n' +
        '  pnpm add @cascivo/email',
    )
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stdin) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Turn the downloaded payload into a `CanIEmailData`, or say why it is not one.
 *
 * `res.json()` hands back `any`, so `as CanIEmailData` would type-check and prove nothing —
 * and this payload is the definition of one you did not produce: third-party, fetched over
 * the network, and cached to disk where anything could edit it. A bad file would otherwise
 * surface as an unreadable `TypeError` from inside `indexFeatures`.
 *
 * Structural failures throw; a feature missing the optional fields is coerced rather than
 * rejected, so an upstream addition cannot break the command.
 */
export function parseMatrix(raw: unknown, source: string): CanIEmailData {
  const bad = (why: string): never => {
    throw new Error(`The Can I email matrix from ${source} is not usable: ${why}`)
  }
  if (typeof raw !== 'object' || raw === null) bad('not a JSON object')
  const root = raw as Record<string, unknown>
  if (!Array.isArray(root['data'])) bad('no `data` array')
  const entries = root['data'] as unknown[]
  if (entries.length === 0) bad('`data` is empty')

  const data: Feature[] = entries.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) return bad(`data[${i}] is not an object`)
    const feature = entry as Record<string, unknown>
    if (typeof feature['slug'] !== 'string') return bad(`data[${i}] has no \`slug\``)
    if (typeof feature['stats'] !== 'object' || feature['stats'] === null) {
      return bad(`data[${i}] (${feature['slug']}) has no \`stats\``)
    }
    return {
      slug: feature['slug'],
      title: typeof feature['title'] === 'string' ? feature['title'] : feature['slug'],
      category: typeof feature['category'] === 'string' ? feature['category'] : 'unknown',
      ...(typeof feature['keywords'] === 'string' ? { keywords: feature['keywords'] } : {}),
      stats: feature['stats'] as Feature['stats'],
    }
  })

  return {
    api_version: typeof root['api_version'] === 'string' ? root['api_version'] : 'unknown',
    last_update_date:
      typeof root['last_update_date'] === 'string' ? root['last_update_date'] : 'unknown',
    data,
  }
}

/** The matrix, from `--data`, from a fresh-enough cache, or from upstream. */
async function loadMatrix(args: string[]): Promise<CanIEmailData> {
  const supplied = flagValue(args, 'data')
  if (supplied !== undefined) {
    if (!existsSync(supplied)) throw new Error(`No such file: ${supplied}`)
    return parseMatrix(JSON.parse(readFileSync(supplied, 'utf8')), supplied)
  }

  const refresh = args.includes('--refresh')
  if (!refresh && existsSync(CACHE) && Date.now() - statSync(CACHE).mtimeMs < MAX_AGE_MS) {
    return parseMatrix(JSON.parse(readFileSync(CACHE, 'utf8')), CACHE)
  }

  const response = await fetch(SOURCE).catch((error: unknown) => {
    throw new Error(
      `Could not fetch the Can I email matrix from ${SOURCE}: ` +
        `${error instanceof Error ? error.message : String(error)}\n` +
        '  Offline? Download it once and pass --data <file>.',
    )
  })
  if (!response.ok) {
    throw new Error(`Could not fetch ${SOURCE}: ${response.status} ${response.statusText}`)
  }
  const text = await response.text()
  // Cache before parsing so a malformed payload is inspectable rather than just gone.
  mkdirSync(dirname(CACHE), { recursive: true })
  writeFileSync(CACHE, text)
  return parseMatrix(JSON.parse(text), SOURCE)
}

function format(findings: Finding[], label: string): string {
  const lines = [label]
  for (const finding of findings) {
    lines.push(
      `  ${finding.level === 'blocked' ? '✗' : '!'} ${finding.slug}  ${finding.source}` +
        `\n      ${finding.clients.join(', ')}`,
    )
  }
  return lines.join('\n')
}

/**
 * Lint one or more rendered emails.
 *
 * Exits non-zero on a blocked finding and only on a blocked finding: a caveat is partial
 * support an author wants to know about, not a reason to fail a build.
 */
export async function emailLint(args: string[]): Promise<void> {
  // `positionalArgs` rather than a filter on `-`: a plain filter also keeps the *value* of
  // `--data <file>`, so the matrix itself got linted as if it were an email. The symptom was
  // spectacular — 28 blocked findings against a clean template, because the scanner read
  // slugs like `html-dfn` out of the JSON and took them for tags.
  //
  // A bare `-` is stdin by long convention and looks like a flag to any such parser, so it
  // is added back by name.
  const files = [...positionalArgs(args, ['data']), ...(args.includes('-') ? ['-'] : [])]
  if (files.length === 0) {
    throw new Error('cascivo email lint needs a file, or `-` to read rendered HTML from stdin.')
  }

  const { lint, indexFeatures, CASCIVO_ALLOW } = await loadEmail()
  const features = indexFeatures(await loadMatrix(args))
  const allow = args.includes('--no-allowlist') ? {} : CASCIVO_ALLOW

  let blockedTotal = 0
  let caveatTotal = 0

  for (const file of files) {
    const html = file === '-' ? await readStdin() : readFileSync(file, 'utf8')
    const findings = lint(html, features, { allow })
    const blocked = findings.filter((f) => f.level === 'blocked')
    const caveats = findings.filter((f) => f.level === 'caveat')
    blockedTotal += blocked.length
    caveatTotal += caveats.length

    const name = file === '-' ? '(stdin)' : file
    if (blocked.length === 0 && caveats.length === 0) {
      console.log(`✓ ${name}`)
      continue
    }
    console.log(format([...blocked, ...caveats], `${blocked.length === 0 ? '✓' : '✗'} ${name}`))
  }

  const summary =
    `\n${files.length} file${files.length === 1 ? '' : 's'}, ` +
    `${blockedTotal} blocked, ${caveatTotal} caveat${caveatTotal === 1 ? '' : 's'}.`
  console.log(summary)
  if (blockedTotal > 0) process.exitCode = 1
}

/** Dispatch `cascivo email <subcommand>`. */
export async function email(args: string[]): Promise<void> {
  const [subcommand, ...rest] = args
  if (subcommand === 'lint') {
    await emailLint(rest)
    return
  }
  console.error(
    subcommand === undefined
      ? 'cascivo email needs a subcommand. Try `cascivo email lint --help`.'
      : `Unknown email subcommand: ${subcommand}`,
  )
  process.exitCode = 1
}
