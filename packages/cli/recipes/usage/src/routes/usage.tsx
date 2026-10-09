import { BarChart, Kpi, LineChart } from '@cascivo/charts'
import { createClient } from '@cascivo/app/api'
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Flex,
  Grid,
  Heading,
  Text,
  signal,
  useSignals,
} from '@cascivo/react'
import { api } from '../api'
import type { UsageReport } from '../usage'

const client = createClient(api)
const report = signal<UsageReport | null>(null)
const failed = signal<string | null>(null)

async function load(): Promise<void> {
  failed.value = null
  try {
    report.value = await client.usage()
  } catch (error) {
    failed.value = error instanceof Error ? error.message : 'Could not load usage'
  }
}
void load()

/** Analytics Engine returns hours as "2026-09-30 14:00:00", in UTC. */
const toDate = (hour: string) => new Date(`${hour.replace(' ', 'T')}Z`)

export default function Usage() {
  useSignals()
  const data = report.value

  return (
    <Flex gap={4}>
      <Flex direction="horizontal" align="center" justify="between" wrap gap={3}>
        <Flex gap={1}>
          <Heading level={1}>Usage</Heading>
          <Text muted>Every API request, recorded by the Worker in Workers Analytics Engine.</Text>
        </Flex>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </Flex>
      {failed.value ? <Text muted>{failed.value}</Text> : null}
      {data && !data.configured ? (
        <EmptyState
          title="Connect Analytics Engine to read usage"
          description="The Worker already records every request. To read them back it needs your account id and an API token with Account Analytics: Read, as secrets: npx wrangler secret put CF_ACCOUNT_ID, then npx wrangler secret put CF_API_TOKEN. For vite dev, put both in .dev.vars."
        />
      ) : null}
      {data && data.configured ? (
        <>
          <Grid cols={3} gap={3}>
            <Kpi label="Requests, 24 h" value={data.totals.requests.toLocaleString()} />
            <Kpi label="Server errors" value={data.totals.errors.toLocaleString()} />
            <Kpi label="Average latency" value={`${data.totals.avgMs} ms`} />
          </Grid>
          <Card>
            <CardContent>
              <LineChart
                title="Requests per hour"
                series={[{ id: 'requests', label: 'Requests', data: data.hourly }]}
                x={(d) => toDate(d.hour)}
                y={(d) => d.requests}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <BarChart
                title="Busiest routes"
                series={[{ id: 'routes', label: 'Requests', data: data.routes }]}
                x={(d) => d.path}
                y={(d) => d.requests}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </Flex>
  )
}
