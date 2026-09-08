/**
 * Read the Can I email support matrix and answer one question: may this feature appear in
 * a cascivo email?
 *
 * The matrix itself is vendored at `scripts/email/vendor/caniemail.json` (MIT, Can I email)
 * and is **passed in** rather than imported. It is ~483 KB and exists to serve build-time
 * checks and the preview app's compatibility panel; bundling it into the published package
 * would put half a megabyte of test data in every adopter's node_modules.
 */

export type SupportCode = 'y' | 'n' | 'a' | 'u'

export interface Feature {
  slug: string
  title: string
  category: string
  keywords?: string
  /** family → platform → version → code, e.g. `stats.outlook.windows['2019'] === 'n'`. */
  stats: Record<string, Record<string, Record<string, string>>>
}

export interface CanIEmailData {
  api_version: string
  last_update_date: string
  data: Feature[]
}

/** One client in the support floor: a Can I email family plus one of its platforms. */
export interface ClientRef {
  family: string
  platform: string
  /** Display name for messages — the matrix's own nicenames are not carried in the slim file. */
  label: string
}

/**
 * The clients a cascivo email must render correctly in.
 *
 * Outlook Windows is the binding constraint and the reason the primitive set is built on
 * tables: it is the Word rendering engine, and it fails almost every modern CSS feature.
 * It is in the floor precisely because it cannot be tested in-house — the lint is the only
 * thing standing between the generator and a broken Outlook render.
 */
export const DEFAULT_FLOOR: readonly ClientRef[] = [
  { family: 'outlook', platform: 'windows', label: 'Outlook (Windows)' },
  { family: 'outlook', platform: 'outlook-com', label: 'Outlook.com' },
  { family: 'gmail', platform: 'desktop-webmail', label: 'Gmail (desktop webmail)' },
  { family: 'gmail', platform: 'android', label: 'Gmail (Android)' },
  { family: 'gmail', platform: 'ios', label: 'Gmail (iOS)' },
  { family: 'apple-mail', platform: 'macos', label: 'Apple Mail (macOS)' },
  { family: 'apple-mail', platform: 'ios', label: 'Apple Mail (iOS)' },
  { family: 'yahoo', platform: 'desktop-webmail', label: 'Yahoo! Mail (desktop webmail)' },
]

/**
 * Version keys sort lexicographically into chronological order in this dataset — they are
 * either years (`2019`) or `YYYY-MM` (`2023-01`), with one `16.80` outlier under
 * `outlook.macos` that sorts after the dated keys and is indeed the newer build.
 */
function latestVersion(versions: Record<string, string>): string | undefined {
  return Object.keys(versions).sort().at(-1)
}

/** Strip Can I email's footnote markers: `"a #1"` → `"a"`. */
function code(raw: string): SupportCode {
  const c = raw.trim()[0]
  return c === 'y' || c === 'n' || c === 'a' || c === 'u' ? c : 'u'
}

export interface ClientVerdict {
  client: ClientRef
  code: SupportCode
  version: string | undefined
}

/**
 * How a feature fares against the floor.
 *
 * - `ok` — every floor client reports `y`.
 * - `blocked` — at least one reports `n`. The feature genuinely does not work; this is the
 *   hard gate.
 * - `caveat` — at least one reports `a` (partial) and none reports `n`.
 * - `untested` — the slug is absent from the matrix, or every reading is `u`.
 */
export type Level = 'ok' | 'blocked' | 'caveat' | 'untested'

export interface FeatureVerdict {
  slug: string
  level: Level
  /** Floor clients not reporting `y`, with the code each reported. */
  findings: ClientVerdict[]
}

export function indexFeatures(data: CanIEmailData): Map<string, Feature> {
  return new Map(data.data.map((f) => [f.slug, f]))
}

/**
 * Verdict for one feature slug against a support floor.
 *
 * **Only `n` blocks.** An earlier revision treated partial (`a`) as failure too, which
 * rejected `font-size`, `padding`, `text-align` and `width` — the four most basic
 * declarations in any email. The reason is that Can I email uses `a` plus a footnote for
 * "works, with a caveat": padding is `a #1 #2` in Outlook Windows because it applies to
 * `<td>` but not `<div>`. Those footnotes are prose, and nothing here can read them.
 *
 * So the division of labour is: **this module blocks what is genuinely broken, and the
 * structural invariants in `structure.ts` enforce the caveats directly** — "padding only
 * appears on `<td>`" is a precise assertion about our own output, and a far better guard
 * than an attempt to interpret footnote #1.
 *
 * `untested` is likewise not a failure. `<td>`, `<a>` and `<h1>` are absent from the matrix
 * because they are foundational HTML nobody needs to test; reporting them as unsupported
 * would be false. Callers decide what to do with the level — the conformance lint blocks
 * on `blocked` and reports the rest.
 */
export function verdict(
  features: Map<string, Feature>,
  slug: string,
  floor: readonly ClientRef[] = DEFAULT_FLOOR,
): FeatureVerdict {
  const feature = features.get(slug)
  if (!feature) return { slug, level: 'untested', findings: [] }

  const findings: ClientVerdict[] = []
  let covered = 0
  for (const client of floor) {
    const versions = feature.stats[client.family]?.[client.platform]
    if (!versions) continue
    covered += 1
    const version = latestVersion(versions)
    const c = version === undefined ? 'u' : code(versions[version]!)
    if (c !== 'y') findings.push({ client, code: c, version })
  }

  if (findings.some((f) => f.code === 'n')) return { slug, level: 'blocked', findings }
  if (findings.some((f) => f.code === 'a')) return { slug, level: 'caveat', findings }
  // A feature present in the matrix but tested on none of the floor clients is untested,
  // not ok — an empty findings list would otherwise read as unanimous approval.
  if (covered === 0 || findings.length > 0) return { slug, level: 'untested', findings }
  return { slug, level: 'ok', findings }
}
