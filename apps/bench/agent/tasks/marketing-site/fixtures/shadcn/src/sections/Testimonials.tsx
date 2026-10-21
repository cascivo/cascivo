import { Card, CardContent } from '@/components/ui/card'

const QUOTES = [
  { quote: 'Our review cycle went from days to hours.', who: 'Priya, staff engineer at Northwind' },
  { quote: 'Designers finally review the real thing.', who: 'Marco, CTO at Lumen' },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="flex flex-col gap-8">
      <h2 className="text-3xl font-semibold tracking-tight">Loved by developers</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {QUOTES.map((q) => (
          <Card key={q.who}>
            <CardContent>
              <figure className="flex flex-col gap-4">
                <blockquote className="text-lg">“{q.quote}”</blockquote>
                <figcaption className="text-sm text-muted-foreground">{q.who}</figcaption>
              </figure>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
