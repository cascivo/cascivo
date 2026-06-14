import { seededRandom } from '@cascivo/example-kit'

// --- Process definition (static, hand-authored) ---

export interface FlowNode {
  id: string
  label: string
  type: 'start' | 'task' | 'gateway' | 'end'
  x: number
  y: number
}

export interface FlowEdge {
  id: string
  from: string
  to: string
  label?: string
}

export const PROCESS_NODES: FlowNode[] = [
  { id: 'start', label: 'Start', type: 'start', x: 60, y: 200 },
  { id: 'review', label: 'Review Doc', type: 'task', x: 180, y: 200 },
  { id: 'approve', label: 'Approve?', type: 'gateway', x: 330, y: 200 },
  { id: 'sign', label: 'Sign Doc', type: 'task', x: 470, y: 120 },
  { id: 'send', label: 'Send to Archive', type: 'task', x: 610, y: 120 },
  { id: 'reject', label: 'Reject & Notify', type: 'task', x: 470, y: 280 },
  { id: 'end', label: 'End', type: 'end', x: 750, y: 200 },
]

export const PROCESS_EDGES: FlowEdge[] = [
  { id: 'e1', from: 'start', to: 'review' },
  { id: 'e2', from: 'review', to: 'approve' },
  { id: 'e3', from: 'approve', to: 'sign', label: 'Yes' },
  { id: 'e4', from: 'approve', to: 'reject', label: 'No' },
  { id: 'e5', from: 'sign', to: 'send' },
  { id: 'e6', from: 'send', to: 'end' },
  { id: 'e7', from: 'reject', to: 'end' },
]

// --- Seeded fixtures ---

const rng = seededRandom(13)

export type InstanceStatus = 'active' | 'completed' | 'incident'

export interface ProcessInstance {
  id: string
  status: InstanceStatus
  currentNodeId: string | null
  startedAt: string
  variables: Record<string, unknown>
  history: Array<{ nodeId: string; timestamp: string }>
}

export interface Incident {
  id: string
  instanceId: string
  nodeId: string
  message: string
  timestamp: string
}

export interface UserTask {
  id: string
  instanceId: string
  name: string
  assignee: string | null
  candidateGroup: string
}

const TASK_NODE_IDS = ['review', 'sign', 'send', 'reject']
const ASSIGNEE_NAMES = ['alice@acme.io', 'bob@acme.io', 'carol@acme.io']
const CANDIDATE_GROUPS = ['reviewers', 'signers', 'archivists']
const INCIDENT_MESSAGES = [
  'Timeout waiting for approval',
  'Signature service unavailable',
  'Archive storage quota exceeded',
]

const BASE_DATE = new Date(Date.UTC(2026, 5, 14))

function isoOffset(daysAgo: number, hoursAgo = 0): string {
  const d = new Date(BASE_DATE)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(d.getUTCHours() - hoursAgo)
  return d.toISOString()
}

const STATUSES: InstanceStatus[] = [
  'active',
  'active',
  'active',
  'active',
  'completed',
  'completed',
  'completed',
  'completed',
  'incident',
  'incident',
]

export const INSTANCES: ProcessInstance[] = Array.from({ length: 10 }, (_, i) => {
  const status = STATUSES[i] as InstanceStatus
  const currentNodeId =
    status === 'active'
      ? rng.pick(TASK_NODE_IDS)
      : status === 'incident'
        ? rng.pick(TASK_NODE_IDS)
        : null

  const daysAgo = rng.int(0, 14)
  const startedAt = isoOffset(daysAgo, rng.int(0, 23))

  // Build a short history of transitions
  const possibleHistory: Array<{ nodeId: string; timestamp: string }> = [
    { nodeId: 'start', timestamp: isoOffset(daysAgo, rng.int(12, 23)) },
    { nodeId: 'review', timestamp: isoOffset(daysAgo, rng.int(6, 12)) },
  ]
  if (currentNodeId && currentNodeId !== 'review') {
    possibleHistory.push({ nodeId: 'approve', timestamp: isoOffset(daysAgo, rng.int(3, 6)) })
    possibleHistory.push({ nodeId: currentNodeId, timestamp: isoOffset(daysAgo, rng.int(0, 3)) })
  }
  if (status === 'completed') {
    possibleHistory.push({ nodeId: 'end', timestamp: isoOffset(daysAgo - 1, 0) })
  }

  return {
    id: `inst-${String(i).padStart(3, '0')}`,
    status,
    currentNodeId: status === 'completed' ? null : currentNodeId,
    startedAt,
    variables: {
      documentId: `doc-${1000 + i}`,
      requester: rng.pick(ASSIGNEE_NAMES),
      priority: rng.pick(['low', 'medium', 'high']),
      amount: rng.int(100, 50000),
    },
    history: possibleHistory,
  }
})

export const INCIDENTS: Incident[] = Array.from({ length: 3 }, (_, i) => {
  const incidentInstances = INSTANCES.filter((inst) => inst.status === 'incident')
  const instance = incidentInstances[i % incidentInstances.length]!
  return {
    id: `inc-${i}`,
    instanceId: instance.id,
    nodeId: instance.currentNodeId ?? 'review',
    message: INCIDENT_MESSAGES[i % INCIDENT_MESSAGES.length]!,
    timestamp: isoOffset(rng.int(0, 3), rng.int(0, 12)),
  }
})

export const USER_TASKS: UserTask[] = Array.from({ length: 3 }, (_, i) => {
  const activeInstances = INSTANCES.filter((inst) => inst.status === 'active')
  const instance = activeInstances[i % activeInstances.length]!
  return {
    id: `task-${i}`,
    instanceId: instance.id,
    name: `Review document doc-${1000 + i}`,
    assignee: i === 0 ? rng.pick(ASSIGNEE_NAMES) : null,
    candidateGroup: rng.pick(CANDIDATE_GROUPS),
  }
})
