'use client'
import { Badge } from '../../badge/badge'
import { Button } from '../../button/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../card/card'
import styles from './pricing.module.css'

type Tier = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Hobby',
    price: '$0',
    period: '/mo',
    description: 'For side projects and experiments.',
    features: ['Up to 3 projects', 'Community support', '1 GB storage'],
    cta: 'Get started',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    description: 'For professionals shipping to production.',
    features: ['Unlimited projects', 'Priority support', '100 GB storage', 'Advanced analytics'],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Team',
    price: '$49',
    period: '/mo',
    description: 'For teams that build together.',
    features: ['Everything in Pro', 'SSO & SAML', 'Audit logs', 'Dedicated support'],
    cta: 'Contact sales',
  },
]

export function Pricing() {
  return (
    <section className={styles['root']} aria-label="Pricing plans">
      <div className={styles['header']}>
        <h2 className={styles['heading']}>Simple, transparent pricing</h2>
        <p className={styles['subtitle']}>Start free. Upgrade when you grow. Cancel anytime.</p>
      </div>
      <div className={styles['grid']}>
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            variant={tier.featured ? 'elevated' : 'outlined'}
            className={styles['card']}
            data-featured={tier.featured ? '' : undefined}
          >
            <CardHeader>
              <div className={styles['tierName']}>
                <CardTitle>{tier.name}</CardTitle>
                {tier.featured ? <Badge variant="success">Popular</Badge> : null}
              </div>
              <p className={styles['price']}>
                <span className={styles['amount']}>{tier.price}</span>
                <span className={styles['period']}>{tier.period}</span>
              </p>
              <p className={styles['tierDescription']}>{tier.description}</p>
            </CardHeader>
            <CardContent>
              <ul className={styles['features']}>
                {tier.features.map((feature) => (
                  <li key={feature} className={styles['feature']}>
                    <span aria-hidden="true" className={styles['check']}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant={tier.featured ? 'primary' : 'secondary'} className={styles['cta']}>
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
