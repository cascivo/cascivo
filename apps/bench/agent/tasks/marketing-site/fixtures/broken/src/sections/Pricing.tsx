import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Grid,
  Heading,
  Text,
} from '@cascivo/react'

const PLANS = [
  { name: 'Hobby', price: '$0', note: 'One project, community support.' },
  { name: 'Pro', price: '$20', note: 'Unlimited projects, preview comments.' },
  { name: 'Team', price: '$99', note: 'SSO, audit log, priority support.' },
]

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title">
      <Heading level={2} id="pricing-title">
        Pricing
      </Heading>
      <Grid cols={{ base: 1, md: 3 }} gap={4}>
        {PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="lg" weight="semibold">
                {plan.price}/month
              </Text>
              <Text muted>{plan.note}</Text>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Choose {plan.name}</Button>
            </CardFooter>
          </Card>
        ))}
      </Grid>
    </section>
  )
}
