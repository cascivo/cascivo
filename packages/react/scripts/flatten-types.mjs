// Point the published entry types at the nested declaration emitted by tsc
// (rootDir is the repo root so cross-package declarations keep their layout).
import { writeFileSync } from 'node:fs'
writeFileSync(
  new URL('../dist/index.d.ts', import.meta.url),
  "export * from './types/packages/react/src/index'\n",
)
