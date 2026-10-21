import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES = [
  { title: 'Instant previews', body: 'A live URL for every branch, ready before review starts.' },
  { title: 'Zero config', body: 'Detects your framework and build command on first push.' },
  { title: 'Team comments', body: 'Pin feedback to any element of the running preview.' },
]

export function Features() {
  return (
    <section id="features" className="flex flex-col gap-8">
      <h2 className="text-3xl font-semibold tracking-tight">Everything you need to ship</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
