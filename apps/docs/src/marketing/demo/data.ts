export type Deploy = {
  sha: string
  service: string
  env: 'production' | 'staging' | 'preview'
  status: 'live' | 'building' | 'failed' | 'queued'
  duration: string
  at: string
  author: string
}

export const DEPLOYS: Deploy[] = [
  {
    sha: 'f3a91c2',
    service: 'gateway',
    env: 'production',
    status: 'live',
    duration: '2m 14s',
    at: '14:32',
    author: 'mika',
  },
  {
    sha: '8be40d7',
    service: 'billing',
    env: 'production',
    status: 'live',
    duration: '3m 02s',
    at: '14:18',
    author: 'jonas',
  },
  {
    sha: 'c1d77e9',
    service: 'search',
    env: 'staging',
    status: 'building',
    duration: '1m 41s',
    at: '14:11',
    author: 'amara',
  },
  {
    sha: '2f9b3aa',
    service: 'notifications',
    env: 'production',
    status: 'failed',
    duration: '0m 48s',
    at: '13:57',
    author: 'mika',
  },
  {
    sha: 'a64c01f',
    service: 'gateway',
    env: 'preview',
    status: 'live',
    duration: '1m 55s',
    at: '13:49',
    author: 'tomek',
  },
  {
    sha: '90e5d3b',
    service: 'auth',
    env: 'production',
    status: 'live',
    duration: '2m 31s',
    at: '13:21',
    author: 'amara',
  },
  {
    sha: '5dd28c4',
    service: 'billing',
    env: 'staging',
    status: 'queued',
    duration: '—',
    at: '13:09',
    author: 'jonas',
  },
]

export const KPIS = [
  {
    label: 'Requests · 24h',
    value: '4.21M',
    delta: '+3.1%',
    trend: [38, 41, 39, 44, 47, 45, 52, 49, 55, 58, 54, 61],
  },
  {
    label: 'p99 latency',
    value: '182ms',
    delta: '−9ms',
    trend: [221, 210, 215, 198, 204, 196, 191, 188, 193, 186, 184, 182],
  },
  {
    label: 'Error rate',
    value: '0.42%',
    delta: '+0.05pp',
    trend: [0.31, 0.29, 0.35, 0.33, 0.38, 0.36, 0.41, 0.39, 0.44, 0.4, 0.43, 0.42],
  },
  {
    label: 'Active regions',
    value: '9 / 9',
    delta: 'nominal',
    trend: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9],
  },
] as const

/** requests per hour, last 24h, in thousands — one gentle evening peak, no symmetry */
export const TRAFFIC = [
  112, 98, 87, 81, 79, 84, 103, 141, 178, 196, 204, 211, 208, 215, 222, 219, 231, 248, 244, 226,
  198, 171, 143, 126,
]

export const FLAGS = [
  { name: 'edge-cache-v2', description: 'Serve cached responses from edge regions', enabled: true },
  { name: 'streaming-logs', description: 'Stream build logs over SSE', enabled: true },
  { name: 'canary-checks', description: 'Require canary pass before full rollout', enabled: false },
  { name: 'legacy-webhooks', description: 'Deliver v1 webhook payloads', enabled: false },
]

export const INCIDENT = {
  title: 'Elevated 5xx on notifications',
  body: 'Deploy 2f9b3aa rolled back automatically after error budget burn. Retry queue is draining — no action required.',
}

export const ONCALL = {
  name: 'Amara Okafor',
  handle: '@amara',
  until: 'Thu 09:00 UTC',
  token: 'rly_••••8f3a',
}

export const NAV = ['Overview', 'Deploys', 'Incidents', 'Traffic', 'Flags', 'Settings'] as const
