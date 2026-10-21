import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PLANS = [
  { name: 'Hobby', price: '$0', note: 'One project, community support.' },
  { name: 'Pro', price: '$20', note: 'Unlimited projects, preview comments.' },
  { name: 'Team', price: '$99', note: 'SSO, audit log, priority support.' },
]

export function Pricing() {
  return (
    <section id="pricing" className="flex flex-col gap-8">
      <h2 className="text-3xl font-semibold tracking-tight">Simple, transparent pricing</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.note}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">/month</span>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Choose {plan.name}</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
