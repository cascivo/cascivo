import { seededRandom } from '@cascivo/example-kit'

const rng = seededRandom(42)

export type AssetStatus = 'up-to-date' | 'outdated' | 'unavailable'

export interface CatalogAsset {
  id: string
  name: string
  icon: string
  workspaces: number
  projects: number
  latestVersion: string
  onLatest: number
  total: number
  status: AssetStatus
  lastUpdated: string
  workspaceRows: WorkspaceRow[]
}

export interface WorkspaceRow {
  workspace: string
  project: string
  versionInUse: string
  lastDeployed: string
}

export interface AdoptionMetric {
  value: string
  label: string
  sub: string
  trend: string
}

export interface ChartPoint {
  day: number
  upToDate: number
  outdated: number
  unpublished: number
}

function isoAgo(daysAgo: number): string {
  const d = new Date(2026, 5, 15)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0] ?? '2026-01-01'
}

const NAMES = [
  'AI Agent Task',
  'Microsoft Office 365 Mail Connector',
  'ServiceNow Outbound Connector',
  'Asana Outbound Connector',
  'Microsoft Teams Outbound Connector',
  'REST API Connector',
  'Slack Connector',
  'Email Service Task Template',
  'Amazon DynamoDB Connector',
  'GitHub Connector',
  'Twilio SMS Connector',
  'Stripe Payments Connector',
]

export const CATALOG_ASSETS: CatalogAsset[] = NAMES.map((name, i) => {
  const workspaces = Math.floor(rng.next() * 10) + 2
  const projects = Math.floor(rng.next() * 14) + 2
  const total = Math.floor(rng.next() * 12) + 3
  const onLatest = Math.floor(rng.next() * total)
  const statuses: AssetStatus[] = ['up-to-date', 'outdated', 'unavailable']
  const status = statuses[Math.floor(rng.next() * statuses.length)] ?? 'outdated'
  const major = Math.floor(rng.next() * 4) + 1
  const minor = Math.floor(rng.next() * 5)
  const patch = Math.floor(rng.next() * 10)
  const daysAgo = Math.floor(rng.next() * 120) + 1
  return {
    id: `asset-${i}`,
    name,
    icon: ['📦', '📧', '🔗', '📋', '🤖'][i % 5] ?? '📦',
    workspaces,
    projects,
    latestVersion: `v${major}.${minor}.${patch}`,
    onLatest,
    total,
    status,
    lastUpdated: isoAgo(daysAgo),
    workspaceRows: Array.from({ length: Math.min(workspaces, 3) }, (_, wi) => ({
      workspace: `Workspace ${wi + 1}`,
      project: `Project ${String.fromCharCode(65 + wi)}`,
      versionInUse: `v${major}.${Math.max(0, minor - wi)}.0`,
      lastDeployed: isoAgo(Math.floor(rng.next() * 30) + 1),
    })),
  }
})

export const ADOPTION_METRICS: AdoptionMetric[] = [
  {
    value: '25',
    label: 'Assets in the catalog',
    sub: '5 added in the last 30 days',
    trend: '+9.9%',
  },
  {
    value: '66%',
    label: 'Processes using catalog assets',
    sub: '89 of 135 production processes',
    trend: '+11.9%',
  },
  {
    value: '20%',
    label: 'Processes using up-to-date catalog assets',
    sub: '27 of 135 production processes',
    trend: '+18.7%',
  },
  {
    value: '46%',
    label: 'Processes using outdated catalog assets',
    sub: '62 of 135 production processes',
    trend: '+15.0%',
  },
]

export const CHART_DATA: ChartPoint[] = Array.from({ length: 31 }, (_, i) => {
  const base = 38 + Math.floor(rng.next() * 8)
  return {
    day: 30 - i,
    upToDate: base + Math.floor(rng.next() * 15),
    outdated: Math.floor(rng.next() * 20) + 10,
    unpublished: Math.floor(rng.next() * 8) + 2,
  }
})

export const TOP_ASSETS = CATALOG_ASSETS.slice(0, 5).map((a) => ({
  name: a.name,
  count: Math.floor(rng.next() * 5) + 9,
  max: 14,
}))

export interface ProjectFile {
  id: string
  name: string
  outdated: boolean
  lastModified: string
  modifiedBy: string
  createdBy: string
}

export interface ProjectDetail {
  assetId: string
  files: ProjectFile[]
  readme: string
  gitRepo: string
  gitBranch: string
  deployEnv: string
  deployTime: string
}

const PEOPLE = ['Alex Rivera', 'Lisa Wang', 'Jordan Lee', 'Sam Chen', 'Taylor Kim']

const FILE_NAMES = [
  ['registration-flow.bpmn', 'customer-type-routing.dmn', 'email-verification.bpmn', 'README.md'],
  ['payment-gateway-flow.bpmn', 'fraud-detection.dmn', 'notification-service.bpmn', 'README.md'],
  ['onboarding-workflow.bpmn', 'eligibility-check.dmn', 'welcome-email.bpmn', 'README.md'],
]

export const PROJECT_DETAILS: ProjectDetail[] = CATALOG_ASSETS.map((a, i) => ({
  assetId: a.id,
  files: (FILE_NAMES[i % FILE_NAMES.length] ?? FILE_NAMES[0]!).map((name, fi) => ({
    id: `file-${i}-${fi}`,
    name,
    outdated: fi === 0 && a.status !== 'up-to-date',
    lastModified: `${Math.floor(rng.next() * 5) + 1} days ago`,
    modifiedBy: PEOPLE[Math.floor(rng.next() * PEOPLE.length)] ?? 'Alex Rivera',
    createdBy: PEOPLE[Math.floor(rng.next() * PEOPLE.length)] ?? 'Alex Rivera',
  })),
  readme: `## ${a.name}\n\nEnd-to-end workflow covering identity verification, account provisioning, and welcome communications. Designed for omnichannel onboarding across web, mobile, and branch.\n\n### Workflow Steps\n\n- Personal information capture and validation\n- Document upload and identity verification`,
  gitRepo: `org/${a.name.toLowerCase().replace(/\s+/g, '-')}-project`,
  gitBranch: 'main',
  deployEnv: 'Production',
  deployTime: `${Math.floor(rng.next() * 24) + 1} hours ago`,
}))
