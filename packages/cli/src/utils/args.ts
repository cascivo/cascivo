import { isPackageManager, type PackageManager } from './config.js'

/**
 * Read `--key value` or `--key=value` from an argv slice. Ignores a following
 * token that is itself a flag (so `--tokens --dry-run` yields undefined, not
 * `--dry-run`).
 */
export function flagValue(args: string[], key: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`--${key}=`))
  if (eq) return eq.slice(key.length + 3)
  const idx = args.indexOf(`--${key}`)
  const next = idx !== -1 ? args[idx + 1] : undefined
  return next && !next.startsWith('--') ? next : undefined
}

/**
 * Extract positional (non-flag) arguments from an argv slice. Any token starting
 * with `-` is dropped, as is the value token immediately following a flag named
 * in `valueFlags` (e.g. `pnpm` in `--pm pnpm`), so component names never pick up
 * a flag or its value.
 */
export function positionalArgs(args: string[], valueFlags: string[] = []): string[] {
  const out: string[] = []
  for (let i = 0; i < args.length; i++) {
    const token = args[i]!
    if (token.startsWith('-')) {
      const key = token.replace(/^--?/, '').split('=')[0]!
      const next = args[i + 1]
      if (
        valueFlags.includes(key) &&
        !token.includes('=') &&
        next !== undefined &&
        !next.startsWith('-')
      ) {
        i++ // skip the flag's value token
      }
      continue
    }
    out.push(token)
  }
  return out
}

/**
 * Resolve the `--package-manager` / `--pm` flag to a validated PackageManager.
 * Absent flag → `{ pm: undefined }` (fall back to auto-detection). Unknown value
 * → `{ error }` so the caller can print it and exit non-zero.
 */
export function resolvePackageManagerFlag(
  args: string[],
): { pm: PackageManager | undefined } | { error: string } {
  const raw = flagValue(args, 'package-manager') ?? flagValue(args, 'pm')
  if (raw === undefined) return { pm: undefined }
  if (isPackageManager(raw)) return { pm: raw }
  return { error: `Unknown package manager "${raw}". Use one of: pnpm, yarn, npm, bun.` }
}
