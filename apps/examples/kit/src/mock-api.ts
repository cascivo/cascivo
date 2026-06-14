import { mulberry32 } from './seeded-random'

export type DeployStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'

export interface Stage {
  id: string
  name: string
  status: DeployStatus
  durationMs: number
}

export interface Pipeline {
  id: string
  name: string
  branch: string
  commit: string
  stages: Stage[]
  triggeredAt: string
  status: DeployStatus
}

export interface Environment {
  id: string
  name: string
  tier: 'prod' | 'staging' | 'dev'
  currentVersion: string
  lastDeployAt: string
  health: 'healthy' | 'degraded' | 'down'
}

export interface Metrics {
  deployFrequency: number
  leadTime: number
  changeFailRate: number
  mttr: number
}

export interface MockApi {
  getPipelines(): Pipeline[]
  getEnvironments(): Environment[]
  getMetrics(): Metrics
}

const PIPELINE_NAMES = ['web-frontend', 'api-gateway', 'auth-service', 'data-pipeline', 'cdn-edge']
const BRANCH_NAMES = ['main', 'release/v2.1', 'feat/dark-mode', 'fix/auth-race', 'chore/deps']
const STAGE_NAMES = ['lint', 'test', 'build', 'docker', 'deploy']
const STATUSES: DeployStatus[] = ['success', 'success', 'success', 'failed', 'running']
const ENV_NAMES = ['production', 'staging', 'dev-eu', 'dev-us']
const TIERS: Environment['tier'][] = ['prod', 'staging', 'dev', 'dev']
const HEALTH_VALUES: Environment['health'][] = ['healthy', 'healthy', 'healthy', 'degraded', 'down']

function pickWeighted<T>(arr: readonly T[], rand: () => number): T {
  const idx = Math.floor(rand() * arr.length)
  return arr[idx] ?? arr[0]!
}

function isoDate(offsetDays: number, rand: () => number): string {
  const d = new Date(Date.UTC(2026, 5, 14))
  d.setUTCDate(d.getUTCDate() - Math.floor(rand() * offsetDays))
  d.setUTCHours(Math.floor(rand() * 24), Math.floor(rand() * 60), 0, 0)
  return d.toISOString()
}

function commitHash(rand: () => number): string {
  return Array.from({ length: 7 }, () => Math.floor(rand() * 16).toString(16)).join('')
}

export function createMockApi(seed = 0): MockApi {
  const rand = mulberry32(seed)

  function getPipelines(): Pipeline[] {
    return PIPELINE_NAMES.map((name, i) => {
      const status = pickWeighted(STATUSES, rand)
      const stages: Stage[] = STAGE_NAMES.map((stageName, j) => ({
        id: `stage-${i}-${j}`,
        name: stageName,
        status:
          status === 'success'
            ? 'success'
            : j === STAGE_NAMES.length - 1
              ? status
              : pickWeighted(STATUSES, rand),
        durationMs: Math.floor(rand() * 60000) + 5000,
      }))
      return {
        id: `pipe-${i}`,
        name,
        branch: pickWeighted(BRANCH_NAMES, rand),
        commit: commitHash(rand),
        stages,
        triggeredAt: isoDate(7, rand),
        status,
      }
    })
  }

  function getEnvironments(): Environment[] {
    return ENV_NAMES.map((name, i) => ({
      id: `env-${i}`,
      name,
      tier: TIERS[i % TIERS.length]!,
      currentVersion: `v2.${Math.floor(rand() * 10)}.${Math.floor(rand() * 20)}`,
      lastDeployAt: isoDate(3, rand),
      health: pickWeighted(HEALTH_VALUES, rand),
    }))
  }

  function getMetrics(): Metrics {
    return {
      deployFrequency: Math.floor(rand() * 10) + 1,
      leadTime: Math.floor(rand() * 120) + 10,
      changeFailRate: Math.round(rand() * 200) / 10,
      mttr: Math.floor(rand() * 60) + 5,
    }
  }

  return { getPipelines, getEnvironments, getMetrics }
}
