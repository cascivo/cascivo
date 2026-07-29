/**
 * Find a Chromium the browser canaries can actually launch.
 *
 * Playwright pins an exact Chromium build (`chromium-1228` for @playwright/test 1.61) and
 * refuses to launch anything else. That is right for Playwright and wrong for a repo whose
 * canaries have to run in three places at once:
 *
 *   - **CI** installs the pinned build (`playwright install chromium --with-deps`), so the
 *     default path resolves and none of this runs.
 *   - **A dev container / sandbox image** ships whatever Chromium it was baked with —
 *     commonly a different build under `PLAYWRIGHT_BROWSERS_PATH`. Before this helper,
 *     `pnpm ready` simply failed there with "Executable doesn't exist at …/chromium-1228/…",
 *     and the only way through was knowing to set `CASCIVO_CHROMIUM` by hand.
 *   - **A laptop** with the browsers installed normally: same as CI.
 *
 * A version-adjacent Chromium is fine for what these canaries assert — `box-sizing`,
 * `display`, `getBoundingClientRect`, `elementFromPoint`. None of that is build-specific.
 *
 * Resolution order:
 *   1. `CASCIVO_CHROMIUM` — an explicit override always wins.
 *   2. Playwright's own pinned build, if it is actually on disk.
 *   3. Any `chromium-*` under `PLAYWRIGHT_BROWSERS_PATH` (highest build number first).
 *
 * Returns `undefined` when Playwright's own build is present, so the caller passes no
 * `executablePath` and Playwright does its normal thing.
 *
 * **Never returns a "skip" signal.** If nothing is found the caller must fail loudly — a
 * canary that passes when it could not run is worse than no canary, which is the whole
 * reason `computed:check` refuses to try/skip.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Where a dev-container image typically unpacks browsers. */
const DEFAULT_BROWSERS_PATH = '/opt/pw-browsers'

/** Candidate executables inside an unpacked `chromium-<rev>` directory, newest layout first. */
const EXECUTABLE_PATHS = [
  join('chrome-linux64', 'chrome'),
  join('chrome-linux', 'chrome'),
  join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
  join('chrome-win', 'chrome.exe'),
]

function browsersRoot(): string {
  return process.env['PLAYWRIGHT_BROWSERS_PATH'] || DEFAULT_BROWSERS_PATH
}

/** Every `chromium-<rev>` install under the browsers root, highest revision first. */
function installedChromiums(): { revision: number; dir: string }[] {
  const root = browsersRoot()
  if (!existsSync(root)) return []
  return readdirSync(root)
    .map((name) => /^chromium-(\d+)$/.exec(name))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ revision: Number(m[1]), dir: join(root, m[0]) }))
    .sort((a, b) => b.revision - a.revision)
}

/**
 * An `executablePath` to pass to `chromium.launch()`, or `undefined` to let Playwright
 * resolve its own pinned build.
 *
 * @param pinned Playwright's expected path — pass `chromium.executablePath()`. Optional so
 *   callers that cannot cheaply obtain it still get the override + discovery behaviour.
 */
export function resolveChromium(pinned?: string): string | undefined {
  const override = process.env['CASCIVO_CHROMIUM']
  if (override) return override
  if (pinned && existsSync(pinned)) return undefined // Playwright's own build is present

  for (const { dir } of installedChromiums()) {
    for (const rel of EXECUTABLE_PATHS) {
      const candidate = join(dir, rel)
      if (existsSync(candidate)) return candidate
    }
  }
  return undefined // nothing found — let Playwright fail with its own actionable message
}

/** Human-readable note for the canary's log, so a substituted browser is never a surprise. */
export function chromiumNote(resolved: string | undefined): string {
  if (!resolved) return 'chromium: using Playwright’s pinned build'
  if (process.env['CASCIVO_CHROMIUM']) return `chromium: CASCIVO_CHROMIUM=${resolved}`
  return (
    `chromium: Playwright’s pinned build is not installed; using ${resolved} ` +
    `(found under ${browsersRoot()}). Run \`pnpm exec playwright install chromium\` to use ` +
    `the pinned one.`
  )
}
