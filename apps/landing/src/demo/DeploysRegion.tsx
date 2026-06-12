'use client'
import { useSignal } from '@cascade-ui/core'
import { Badge } from '@cascade-ui/components/badge'
import { Button } from '@cascade-ui/components/button'
import { DataTable, type Column } from '@cascade-ui/components/data-table'
import { Modal } from '@cascade-ui/components/modal'
import { Select } from '@cascade-ui/components/select'
import { Input } from '@cascade-ui/components/input'
import { useToast, ToastProvider } from '@cascade-ui/components/toast'
import { DEPLOYS, type Deploy } from './data'

type BadgeVariant = 'success' | 'secondary' | 'destructive' | 'outline'

const STATUS_VARIANT: Record<Deploy['status'], BadgeVariant> = {
  live: 'success',
  building: 'secondary',
  failed: 'destructive',
  queued: 'outline',
}

const columns: Column<Deploy>[] = [
  {
    key: 'sha',
    header: 'SHA',
    render: (row) => <span className="sha-mono">{row.sha}</span>,
    width: '6rem',
  },
  { key: 'service', header: 'Service', sortable: true },
  { key: 'env', header: 'Env', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>,
  },
  {
    key: 'duration',
    header: 'Duration',
    render: (row) => <span className="dur-mono">{row.duration}</span>,
  },
  { key: 'at', header: 'At' },
  { key: 'author', header: 'Author' },
]

const serviceOptions = [
  { value: 'gateway', label: 'gateway' },
  { value: 'billing', label: 'billing' },
  { value: 'search', label: 'search' },
  { value: 'auth', label: 'auth' },
]

const envOptions = [
  { value: 'production', label: 'production' },
  { value: 'staging', label: 'staging' },
  { value: 'preview', label: 'preview' },
]

function DeploysInner() {
  const modalOpen = useSignal(false)
  const { toast } = useToast()

  const handleDeploy = () => {
    modalOpen.value = false
    toast({ title: 'Build queued — gateway @ main', variant: 'success' })
  }

  return (
    <section className="region region-deploys" aria-label="Deploys">
      <header className="region-head">
        <h3>Deploys</h3>
        <Button
          size="sm"
          onClick={() => {
            modalOpen.value = true
          }}
        >
          New deploy
        </Button>
      </header>
      <DataTable
        columns={columns}
        rows={DEPLOYS}
        getRowId={(row) => row.sha}
        density="compact"
        defaultSort={{ key: 'at', direction: 'desc' }}
      />
      <Modal
        open={modalOpen.value}
        onClose={() => {
          modalOpen.value = false
        }}
        title="Deploy a service"
        size="sm"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--cascade-space-4)',
            padding: 'var(--cascade-space-4)',
          }}
        >
          <Select label="Service" options={serviceOptions} defaultValue="gateway" />
          <Select label="Environment" options={envOptions} defaultValue="production" />
          <Input label="Git ref" placeholder="main" />
          <div
            style={{ display: 'flex', gap: 'var(--cascade-space-3)', justifyContent: 'flex-end' }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                modalOpen.value = false
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleDeploy}>
              Deploy
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

export function DeploysRegion() {
  return (
    <ToastProvider>
      <DeploysInner />
    </ToastProvider>
  )
}
