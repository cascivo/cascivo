/**
 * Minimal semver comparison — just enough to evaluate the `>=x.y.z` floors
 * the registry generator emits for `peerVersions` (scripts/registry/generate.ts).
 * Not a general-purpose range parser; unsupported input is treated as
 * unsatisfied so callers surface it rather than silently pass.
 */

function parseVersion(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.trim())
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** Compares two `x.y.z` versions: -1 if a<b, 0 if equal, 1 if a>b. Throws on unparsable input. */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) throw new Error(`Cannot compare versions: "${a}" vs "${b}"`)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i]! < pb[i]! ? -1 : 1
  }
  return 0
}

/** Evaluates whether `installed` satisfies a floor spec of the form `>=x.y.z`. */
export function satisfiesFloor(installed: string, floor: string): boolean {
  const m = /^>=\s*(\d+\.\d+\.\d+)/.exec(floor.trim())
  if (!m) return true // unrecognized floor shape — don't block on it
  try {
    return compareVersions(installed, m[1]!) >= 0
  } catch {
    return true // unparsable installed version — don't block on it
  }
}
