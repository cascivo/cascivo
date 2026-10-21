export interface Project {
  id: string
  name: string
  owner: string
  status: 'Active' | 'Paused' | 'Archived'
}

const NAMES = [
  'Apollo',
  'Borealis',
  'Cassini',
  'Dragonfly',
  'Europa',
  'Freedom',
  'Gemini',
  'Hubble',
  'Insight',
  'Juno',
  'Kepler',
  'Lunar Gateway',
]
const OWNERS = ['Ada', 'Grace', 'Alan', 'Katherine']
const STATUSES: Project['status'][] = ['Active', 'Paused', 'Archived']

export const SEED: Project[] = NAMES.map((name, i) => ({
  id: String(i + 1),
  name,
  owner: OWNERS[i % OWNERS.length] ?? 'Ada',
  status: STATUSES[i % STATUSES.length] ?? 'Active',
}))
