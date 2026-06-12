import { existsSync } from 'node:fs'
import { join } from 'node:path'

export type LibId = 'cascade' | 'shadcn' | 'carbon'

export type BenchApp = {
  id: LibId
  pkg: string
  dir: string
  port: number
}

export const APPS: BenchApp[] = [
  { id: 'cascade', pkg: 'bench-app-cascade', dir: 'apps/bench/app-cascade', port: 4181 },
  { id: 'shadcn', pkg: 'bench-app-shadcn', dir: 'apps/bench/app-shadcn', port: 4182 },
  { id: 'carbon', pkg: 'bench-app-carbon', dir: 'apps/bench/app-carbon', port: 4183 },
]

/** Apps that exist on disk right now — T1 ships only cascade; T2 completes the matrix. */
export function availableApps(repoRoot: string): BenchApp[] {
  return APPS.filter((app) => existsSync(join(repoRoot, app.dir, 'package.json')))
}
