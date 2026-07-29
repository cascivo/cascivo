import { Badge, Button, Card, CardContent } from '@cascivo/react'

/** One island, three components — enough to make per-component CSS emission observable. */
export function Panel({ label }: { label: string }) {
  return (
    <Card>
      <CardContent>
        <Badge variant="success">{label}</Badge>
        <Button onClick={() => undefined}>Acknowledge</Button>
      </CardContent>
    </Card>
  )
}
