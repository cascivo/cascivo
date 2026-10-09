import type { Step } from '@cascivo/react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  Flex,
  Heading,
  ProgressBar,
  Steps,
  Text,
  Textarea,
  useSignals,
  useSignalState,
} from '@cascivo/react'
import { importJob } from '../import-job'
import type { JobState } from '@cascivo/app/jobs'
import type { ImportSummary } from '../import-job'
import { current, startError, startImport, starting } from '../import-page'

const SAMPLE = [
  'name,email',
  ...Array.from({ length: 120 }, (_, i) => `Person ${i + 1},person${i + 1}@example.com`),
  'No Email,',
  ',nameless@example.com',
].join('\n')

/** One Steps entry per job step, from where the job is. */
function stepsOf(state: JobState<ImportSummary>): Step[] {
  return importJob.steps.map((label, i) => ({
    id: label,
    label,
    state:
      state.status === 'done' || i < state.step
        ? 'complete'
        : i > state.step || state.status === 'queued'
          ? 'pending'
          : state.status === 'failed'
            ? 'error'
            : 'active',
  }))
}

function JobView() {
  useSignals()
  const job = current.value
  if (!job) return null
  const state = job.state.value
  return (
    <Card>
      <CardContent>
        <Flex gap={3}>
          <Steps steps={stepsOf(state)} activeStep={state.step} ariaLabel="Import progress" />
          {state.status === 'running' && state.progress !== null ? (
            <ProgressBar
              value={Math.round(state.progress * 100)}
              label={state.message ?? 'Importing'}
            />
          ) : (
            <Text muted>
              {state.status === 'queued' ? 'Waiting to start…' : (state.message ?? '')}
            </Text>
          )}
          {state.status === 'done' && state.output ? (
            <Alert variant="success" title={`Imported ${state.output.imported} contacts`}>
              {state.output.rejected.length === 0
                ? 'Every row was valid.'
                : `Rejected: ${state.output.rejected.map((r) => `line ${r.line} (${r.reason})`).join(', ')}`}
            </Alert>
          ) : null}
          {state.status === 'failed' ? (
            <Alert variant="destructive" title="The import failed">
              {state.error}
            </Alert>
          ) : null}
        </Flex>
      </CardContent>
    </Card>
  )
}

export default function Import() {
  useSignals()
  const [csv, setCsv] = useSignalState(SAMPLE)
  const running = current.value?.state.value.status
  const busy = starting.value || running === 'queued' || running === 'running'

  return (
    <Flex gap={4}>
      <Flex gap={1}>
        <Heading level={1}>Import</Heading>
        <Text muted>
          A CSV import running as a Cloudflare Workflow. Each step retries on its own and the job
          survives a deploy; progress streams here, and a reload picks the job back up.
        </Text>
      </Flex>
      <Textarea
        aria-label="CSV to import"
        rows={8}
        value={csv.value}
        onChange={(event) => setCsv(event.target.value)}
      />
      <Flex direction="horizontal" gap={2} align="center">
        <Button onClick={() => void startImport(csv.value)} loading={busy} disabled={busy}>
          Import
        </Button>
        {startError.value ? <Text muted>{startError.value}</Text> : null}
      </Flex>
      <JobView />
    </Flex>
  )
}
