export type Row = {
  id: number
  name: string
  price: string
  status: 'active' | 'paused' | 'archived'
}

const ADJECTIVES = ['quick', 'calm', 'bright', 'lazy', 'sharp', 'quiet', 'bold', 'plain']
const NOUNS = ['falcon', 'ledger', 'socket', 'matrix', 'beacon', 'kernel', 'cipher', 'relay']
const STATUSES = ['active', 'paused', 'archived'] as const

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function buildRows(count: number, seed = 42): Row[] {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${ADJECTIVES[Math.floor(rand() * ADJECTIVES.length)]} ${NOUNS[Math.floor(rand() * NOUNS.length)]} ${i + 1}`,
    price: `$${(Math.floor(rand() * 99900) / 100 + 1).toFixed(2)}`,
    status: STATUSES[Math.floor(rand() * STATUSES.length)] as Row['status'],
  }))
}

export function updateEveryTenth(rows: Row[]): Row[] {
  return rows.map((row, i) => (i % 10 === 0 ? { ...row, name: `${row.name} !!!` } : row))
}
