// In-content links, a form field, and a data table — the shapes every dashboard has.
import { Card, DataTable, Field, Input, Link as CascadeLink } from '@cascivo/react'
import type { Column } from '@cascivo/react'
import { Link } from '@tanstack/react-router'

interface Deployment {
  id: string
  hash: string
  message: string
}

// `width` here is a table column, not spacing — it must not be reported as a
// hardcoded value that should become `--cascivo-space-12`.
const columns: Column<Deployment>[] = [
  { key: 'hash', header: 'Commit', width: '3rem' },
  { key: 'message', header: 'Message' },
]

export function Deployments({ rows }: { rows: Deployment[] }) {
  return (
    <Card>
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />
    </Card>
  )
}

export function Home() {
  return (
    <Card>
      {/* Router link, styled by cascivo — the documented in-content pattern. */}
      <CascadeLink asChild>
        <Link to="/deployments">Deployments</Link>
      </CascadeLink>
      {/* A bare router Link must NOT be audited against cascivo's Link contract. */}
      <Link to="/settings">Settings</Link>
    </Card>
  )
}

export function Settings() {
  return (
    <Field label="Project name">
      <Input defaultValue="acme" />
    </Field>
  )
}
