import { Card, CardContent, CardHeader, CardTitle, Grid, Heading, Text } from '@cascivo/react'

const FEATURES = [
  { title: 'Instant previews', body: 'A live URL for every branch, ready before review starts.' },
  { title: 'Zero config', body: 'Detects your framework and build command on first push.' },
  { title: 'Team comments', body: 'Pin feedback to any element of the running preview.' },
]

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title">
      <Heading level={2} id="features-title">
        Features
      </Heading>
      <Grid cols={{ base: 1, md: 3 }} gap={4}>
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text>{f.body}</Text>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </section>
  )
}
