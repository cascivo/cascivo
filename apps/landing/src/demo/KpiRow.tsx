import { Card } from '@cascade-ui/components/card'
import { Badge } from '@cascade-ui/components/badge'
import { Sparkline } from '@cascade-ui/charts'
import { KPIS } from './data'

export function KpiRow() {
  return (
    <div className="kpi-row">
      {KPIS.map((kpi) => (
        <Card key={kpi.label} padding="md">
          <span className="kpi-label">{kpi.label}</span>
          <span className="kpi-value">{kpi.value}</span>
          <span className="kpi-foot">
            <Badge variant="outline">{kpi.delta}</Badge>
            <Sparkline data={[...kpi.trend]} label={kpi.label} width={60} height={24} />
          </span>
        </Card>
      ))}
    </div>
  )
}
