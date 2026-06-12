import type { RegistryAdvisory, RegistryItem } from './types.ts'

function parseVersionParts(v: string): number[] {
  return v
    .replace(/^[^0-9]*/, '')
    .split('.')
    .map(Number)
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersionParts(a)
  const pb = parseVersionParts(b)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na !== nb) return na - nb
  }
  return 0
}

function matchesRange(version: string, range: string): boolean {
  try {
    const trimmed = range.trim()
    if (trimmed.startsWith('>=')) {
      return compareVersions(version, trimmed.slice(2).trim()) >= 0
    }
    if (trimmed.startsWith('>')) {
      return compareVersions(version, trimmed.slice(1).trim()) > 0
    }
    if (trimmed.startsWith('<=')) {
      return compareVersions(version, trimmed.slice(2).trim()) <= 0
    }
    if (trimmed.startsWith('<')) {
      return compareVersions(version, trimmed.slice(1).trim()) < 0
    }
    if (trimmed.startsWith('^')) {
      const base = trimmed.slice(1).trim()
      const baseParts = parseVersionParts(base)
      const major = baseParts[0] ?? 0
      const vParts = parseVersionParts(version)
      const vMajor = vParts[0] ?? 0
      return vMajor === major && compareVersions(version, base) >= 0
    }
    if (trimmed.startsWith('~')) {
      const base = trimmed.slice(1).trim()
      const baseParts = parseVersionParts(base)
      const major = baseParts[0] ?? 0
      const minor = baseParts[1] ?? 0
      const vParts = parseVersionParts(version)
      const vMajor = vParts[0] ?? 0
      const vMinor = vParts[1] ?? 0
      return vMajor === major && vMinor === minor && compareVersions(version, base) >= 0
    }
    return version === trimmed
  } catch {
    return false
  }
}

export function matchAdvisories(
  item: Pick<RegistryItem, 'advisories'>,
  lockedVersion: string,
): RegistryAdvisory[] {
  if (!item.advisories) return []
  const matched: RegistryAdvisory[] = []
  for (const adv of item.advisories) {
    try {
      if (matchesRange(lockedVersion, adv.affectedVersions)) {
        matched.push(adv)
      }
    } catch {
      // malformed range — skip silently, never crash an audit
    }
  }
  return matched
}
