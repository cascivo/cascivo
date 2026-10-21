import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const PLANS = [
  { id: 'free', label: 'Free' },
  { id: 'pro', label: 'Pro — $12/month' },
  { id: 'team', label: 'Team — $49/month' },
]

export function Billing() {
  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">Your plan and where invoices go.</p>
      </div>
      <RadioGroup defaultValue="pro" aria-label="Plan">
        {PLANS.map((plan) => (
          <div key={plan.id} className="flex items-center gap-2">
            <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} />
            <Label htmlFor={`plan-${plan.id}`}>{plan.label}</Label>
          </div>
        ))}
      </RadioGroup>
      <div className="grid gap-2">
        <Label htmlFor="billing-email">Billing email</Label>
        <Input id="billing-email" type="email" defaultValue="billing@example.com" />
      </div>
      <Button type="submit" className="self-start">
        Update billing
      </Button>
    </form>
  )
}
