'use client'
import { useComputed, useSignal, useSignals } from '@cascivo/core'
import { DataTable, type Column } from '@cascivo/components/data-table'
import { EmptyState } from '@cascivo/components/empty-state'
import { Kbd } from '@cascivo/components/kbd'
import { SegmentedControl } from '@cascivo/components/segmented-control'
import { VisuallyHidden } from '@cascivo/components/visually-hidden'
import { A11Y_CATEGORIES, A11Y_COVERED, A11Y_ROWS, KEYBOARD_DOCUMENTED, type A11yRow } from './data'

const COLUMNS: Column<A11yRow>[] = [
  { key: 'name', header: 'Component', width: '16%' },
  { key: 'category', header: 'Category', width: '13%' },
  {
    key: 'role',
    header: 'Role',
    width: '17%',
    render: (r) => <code className="a11y-role">{r.role}</code>,
  },
  {
    key: 'wcag',
    header: 'WCAG',
    width: '13%',
    render: (r) =>
      r.wcag
        .replace('2.2-AA', 'WCAG 2.2 AA')
        .replace('2.1-AA', 'WCAG 2.1 AA')
        .replace(/^AA$/, 'WCAG AA'),
  },
  {
    key: 'apgPattern',
    header: 'APG Pattern',
    width: '19%',
    render: (r) =>
      r.apgPattern ? (
        <code className="a11y-role">{r.apgPattern}</code>
      ) : (
        <>
          <span aria-hidden="true">—</span>
          <VisuallyHidden>no pattern</VisuallyHidden>
        </>
      ),
  },
  {
    key: 'keyboard',
    header: 'Keyboard',
    width: '22%',
    render: (r) =>
      r.keyboard.length > 0 ? (
        <span className="a11y-keys">
          {r.keyboard.map((k) => (
            <Kbd key={k} size="sm">
              {k}
            </Kbd>
          ))}
        </span>
      ) : (
        <>
          <span aria-hidden="true">—</span>
          <VisuallyHidden>pointer or static</VisuallyHidden>
        </>
      ),
  },
]

const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  ...A11Y_CATEGORIES.map((c) => ({ label: c, value: c })),
]

export function A11yMatrix() {
  useSignals()
  const category = useSignal('all')
  const rows = useComputed(() =>
    category.value === 'all' ? A11Y_ROWS : A11Y_ROWS.filter((r) => r.category === category.value),
  )
  return (
    <section className="section" id="matrix" data-reveal="">
      <h2>Every entry documents its contract</h2>
      <p className="section-sub">
        Generated from registry.json: {A11Y_COVERED} entries ship machine-readable accessibility
        metadata — ARIA role, WCAG level, and keyboard interaction. {KEYBOARD_DOCUMENTED} of them
        document keyboard support; the rest are static or pointer-driven display entries.
      </p>
      <div className="a11y-matrix-filter">
        <SegmentedControl
          aria-label="Filter matrix by category"
          size="sm"
          options={FILTER_OPTIONS}
          value={category.value}
          onValueChange={(v) => {
            category.value = v
          }}
        />
      </div>
      {rows.value.length === 0 ? (
        <EmptyState
          title="No accessibility data available"
          description="Run pnpm regen to regenerate registry.json with accessibility metadata."
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows.value}
          getRowId={(r) => r.name}
          density="compact"
          stickyHeader
          pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
          title="Keyboard and ARIA matrix"
          description="Role, WCAG level, and keyboard interaction per registry entry, generated from each component.meta.ts."
        />
      )}
    </section>
  )
}
