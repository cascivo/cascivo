export interface DirectoryEntry {
  namespace: string
  name: string
  description: string
  homepage: string
  registryUrl: string
  tags: string[]
  verified: boolean
}

export interface RegistryDirectory {
  schemaVersion: 1
  registries: DirectoryEntry[]
}

export interface DirectoryValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
    }
  }
  return dp[m]![n]!
}

export function validateDirectory(raw: unknown): DirectoryValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['Directory must be an object'], warnings: [] }
  }
  const obj = raw as Record<string, unknown>
  const errors: string[] = []
  const warnings: string[] = []

  if (obj['schemaVersion'] !== 1) {
    errors.push(`schemaVersion must be 1, got ${JSON.stringify(obj['schemaVersion'])}`)
  }
  if (!Array.isArray(obj['registries'])) {
    errors.push('registries must be an array')
    return { ok: false, errors, warnings }
  }

  const namespaces: string[] = []
  for (let i = 0; i < obj['registries'].length; i++) {
    const entry = obj['registries'][i] as Record<string, unknown>
    const ns = entry['namespace']
    if (typeof ns !== 'string' || !ns) errors.push(`registries[${i}].namespace is required`)
    else {
      if (namespaces.includes(ns)) errors.push(`Duplicate namespace "${ns}" at index ${i}`)
      namespaces.push(ns)
    }
    if (typeof entry['name'] !== 'string') errors.push(`registries[${i}].name is required`)
    if (typeof entry['description'] !== 'string')
      errors.push(`registries[${i}].description is required`)
    if (typeof entry['homepage'] !== 'string') errors.push(`registries[${i}].homepage is required`)
    if (typeof entry['registryUrl'] !== 'string')
      errors.push(`registries[${i}].registryUrl is required`)
    else if (!(entry['registryUrl'] as string).includes('{name}'))
      errors.push(`registries[${i}].registryUrl must contain {name} placeholder`)
    if (!Array.isArray(entry['tags'])) errors.push(`registries[${i}].tags must be an array`)
    if (typeof entry['verified'] !== 'boolean')
      errors.push(`registries[${i}].verified must be a boolean`)
  }

  for (let i = 0; i < namespaces.length; i++) {
    for (let j = i + 1; j < namespaces.length; j++) {
      const a = namespaces[i]!
      const b = namespaces[j]!
      if (levenshtein(a, b) <= 2) {
        warnings.push(
          `Namespaces "${a}" and "${b}" are suspiciously similar (Levenshtein distance ≤ 2)`,
        )
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}
