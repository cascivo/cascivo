// Server component (no 'use client'). cascivo display components carry a
// 'use client' directive in the prebuilt dist, so importing them here turns
// them into client references — the markup below is still fully server-rendered.
import { Badge, Card, CardContent, CardHeader, CardTitle, Heading, Text } from '@cascivo/react'
import { ToggleDemo } from './toggle-demo'

export default function Page() {
  return (
    <main style={{ maxInlineSize: '40rem', marginInline: 'auto', padding: '2rem 1rem' }}>
      <Heading level={1}>cascivo + Next.js</Heading>
      <Text muted>
        This page is a React Server Component. The card below is static markup rendered on the
        server; the toggle inside it is a client island driven by a signal.
      </Text>
      <Card>
        <CardHeader>
          <CardTitle>
            Server-rendered card <Badge variant="success">RSC</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleDemo />
        </CardContent>
      </Card>
    </main>
  )
}
