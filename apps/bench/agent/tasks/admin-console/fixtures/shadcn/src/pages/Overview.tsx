import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const KPIS = [
  { label: 'Total users', value: '1,284', note: '+4.2% from last month' },
  { label: 'Active today', value: '312', note: '+1.1% from yesterday' },
  { label: 'Monthly revenue', value: '$48,210', note: '-0.8% from last month' },
]

export function Overview() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {KPIS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
