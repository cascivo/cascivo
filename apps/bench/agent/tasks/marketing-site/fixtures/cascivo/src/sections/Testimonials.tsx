import { Blockquote, Grid, Heading } from '@cascivo/react'

const QUOTES = [
  { quote: 'Our review cycle went from days to hours.', who: 'Priya, staff engineer at Northwind' },
  { quote: 'Designers finally review the real thing.', who: 'Marco, CTO at Lumen' },
]

export function Testimonials() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-title">
      <Heading level={2} id="testimonials-title">
        What our customers say
      </Heading>
      <Grid cols={{ base: 1, md: 2 }} gap={4}>
        {QUOTES.map((q) => (
          <Blockquote key={q.who} cite={q.who}>
            {q.quote}
          </Blockquote>
        ))}
      </Grid>
    </section>
  )
}
