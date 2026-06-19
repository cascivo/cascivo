'use client'
import { Avatar } from '../../avatar/avatar'
import { Card, CardContent } from '../../card/card'
import styles from './testimonials.module.css'

type Quote = { quote: string; name: string; role: string; initials: string }

const QUOTES: Quote[] = [
  {
    quote:
      'We deleted thousands of lines of bespoke CSS and never looked back. The token system just works.',
    name: 'Ada Okonkwo',
    role: 'Staff Engineer, Northwind',
    initials: 'AO',
  },
  {
    quote:
      'The signal-driven components removed an entire class of re-render bugs from our dashboard.',
    name: 'Marco Bianchi',
    role: 'Frontend Lead, Vela',
    initials: 'MB',
  },
  {
    quote:
      'Our AI agents build real UIs against the manifests. It is the first design system that ships for machines too.',
    name: 'Priya Nair',
    role: 'Founder, Loophole',
    initials: 'PN',
  },
]

export function Testimonials() {
  return (
    <section className={styles['root']} aria-label="Customer testimonials">
      <div className={styles['header']}>
        <h2 className={styles['heading']}>Loved by developers</h2>
        <p className={styles['subtitle']}>
          Teams ship faster on a quality floor they do not have to maintain.
        </p>
      </div>
      <div className={styles['grid']}>
        {QUOTES.map((item) => (
          <Card key={item.name} variant="outlined" className={styles['card']}>
            <CardContent>
              <blockquote className={styles['quote']}>{`“${item.quote}”`}</blockquote>
              <div className={styles['person']}>
                <Avatar fallback={item.initials} size="sm" />
                <div className={styles['meta']}>
                  <span className={styles['name']}>{item.name}</span>
                  <span className={styles['role']}>{item.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
