import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Flex,
  Text,
  useSignals,
} from '@cascivo/react'
import { TICKS_PER_STREAM } from './api'
import { connect, disconnect, error, status, ticks } from './live'

/** Streams server-sent events from worker/index.ts into signals via src/live.ts. */
export function LiveCard() {
  useSignals()
  const live = status.value === 'live'
  const latest = ticks.value.at(-1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live from your Worker</CardTitle>
      </CardHeader>
      <CardContent>
        <Flex gap={3}>
          <Text muted>
            <code>worker/index.ts</code> streams events; <code>src/live.ts</code> reads them
            through the typed client for <code>src/api.ts</code>.
          </Text>
          <Flex direction="horizontal" align="center" gap={2}>
            <Badge variant={live ? 'success' : status.value === 'error' ? 'danger' : 'neutral'}>
              {live ? 'Live' : status.value === 'error' ? 'Error' : 'Idle'}
            </Badge>
            <Text>
              {latest
                ? `Tick ${latest.n} of ${TICKS_PER_STREAM} at ${new Date(latest.at).toLocaleTimeString()}`
                : 'No events yet'}
            </Text>
          </Flex>
          {error.value !== null && <Text muted>{error.value}</Text>}
          <div>
            <Button variant={live ? 'secondary' : 'primary'} onClick={live ? disconnect : () => void connect()}>
              {live ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </Flex>
      </CardContent>
    </Card>
  )
}
