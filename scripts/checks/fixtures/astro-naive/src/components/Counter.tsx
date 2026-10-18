import { Badge, Button, Card, CardContent, useSignalState, useSignals } from '@cascivo/react'

/** A card, a badge and a button: enough CSS modules to make per-component emission observable. */
export function Counter({ label }: { label: string }) {
  useSignals()
  const [count, setCount] = useSignalState(0)
  return (
    <Card>
      <CardContent>
        <Badge variant="success">{label}</Badge>
        <Button data-testid="counter" onClick={() => setCount((n) => n + 1)}>
          Count {count.value}
        </Button>
      </CardContent>
    </Card>
  )
}
