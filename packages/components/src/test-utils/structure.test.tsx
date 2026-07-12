/**
 * PR-blocking structural snapshot.
 *
 * Renders a curated set of components and asserts their accessibility-relevant
 * DOM shape (tag plus role, aria-* and data-state — no classes, text or styles)
 * against a committed baseline. A change that silently drops a landmark, role, or aria
 * wiring fails here with a readable tree diff — the fast PR gate the pixel
 * suite (nightly, not PR-blocking) deliberately isn't.
 *
 * This runs inside the component test suite, which CI already runs and blocks
 * on — so it is a PR gate for free. Update the baseline after an intentional
 * structural change by deleting it and re-running (it auto-bootstraps a fresh
 * one), then review the JSON diff and commit it:
 *   rm packages/components/src/test-utils/structure.baseline.json
 *   pnpm exec vp run @cascivo/components#test structure
 *
 * The subject set is a starter — extend SUBJECTS with more components (portal /
 * timer-driven overlays need deterministic setup) as coverage grows.
 */
import { afterAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReactElement } from 'react'
import { structuralRoots, type StructNode } from './structure.ts'
import { Button } from '../button/button.tsx'
import { Badge } from '../badge/badge.tsx'
import { Separator } from '../separator/separator.tsx'
import { Breadcrumb } from '../breadcrumb/breadcrumb.tsx'
import { Alert } from '../alert/alert.tsx'
import { Card } from '../card/card.tsx'
import { Spinner } from '../spinner/spinner.tsx'
import { Status } from '../status/status.tsx'

const SUBJECTS: Record<string, () => ReactElement> = {
  button: () => <Button>Go</Button>,
  badge: () => <Badge>New</Badge>,
  separator: () => <Separator />,
  breadcrumb: () => (
    <Breadcrumb
      items={[{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'Button' }]}
    />
  ),
  alert: () => (
    <Alert variant="warning" title="Heads up">
      Something needs attention.
    </Alert>
  ),
  card: () => <Card>Content</Card>,
  spinner: () => <Spinner />,
  status: () => <Status status="success" pulse />,
}

const BASELINE_PATH = join(import.meta.dirname, 'structure.baseline.json')
const UPDATE = process.env.STRUCT_UPDATE === '1'

describe('structural snapshot', () => {
  const captured: Record<string, StructNode[]> = {}
  // Auto-bootstrap: if no baseline is committed yet, write it on this run
  // instead of failing. Force a rewrite of an existing baseline with
  // STRUCT_UPDATE=1. CI (baseline present, no env) always compares.
  const hasBaseline = existsSync(BASELINE_PATH)
  const shouldWrite = UPDATE || !hasBaseline
  const baseline: Record<string, StructNode[]> =
    !shouldWrite && hasBaseline
      ? (JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as Record<string, StructNode[]>)
      : {}

  for (const [name, factory] of Object.entries(SUBJECTS)) {
    it(name, () => {
      const { container } = render(factory())
      captured[name] = structuralRoots(container)
      if (!shouldWrite) {
        expect(
          captured[name],
          `${name} structure drifted — review and STRUCT_UPDATE=1 to accept`,
        ).toEqual(baseline[name])
      }
    })
  }

  afterAll(() => {
    if (shouldWrite) {
      const sorted: Record<string, StructNode[]> = {}
      for (const k of Object.keys(captured).sort()) sorted[k] = captured[k]!
      writeFileSync(BASELINE_PATH, `${JSON.stringify(sorted, null, 2)}\n`)
    }
  })
})
