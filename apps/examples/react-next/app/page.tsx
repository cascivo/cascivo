// Server component (no 'use client'). Interactive cascivo components carry a
// 'use client' directive in the prebuilt dist, so importing them here turns
// them into client references — the markup below is still fully server-rendered.
//
// `Label` is load-bearing in this example, not decoration: it is a `clientJs: 'none'`
// component that resolves its default text through `@cascivo/i18n`, which is the exact
// shape that used to crash the build with "Attempted to call signal() from the server"
// (@cascivo/i18n took `signal` from @cascivo/core, whose bundle carries a 'use client'
// banner). Keep it rendered from this Server Component — `scripts/checks/rsc-boundary.test.ts`
// guards the module graph, and this guards the real framework.
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Label,
  Text,
} from '@cascivo/react'
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
          <Label htmlFor="probe">Server-rendered label</Label>
          <ToggleDemo />
        </CardContent>
      </Card>
    </main>
  )
}
