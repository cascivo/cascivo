import { AreaChart } from '@cascade-ui/charts'
import { TRAFFIC } from './data'

const trafficSeries = [
  {
    id: 'requests',
    label: 'Requests/hour',
    data: TRAFFIC.map((y, x) => ({ x, y })),
  },
]

export function TrafficRegion() {
  return (
    <section className="region" aria-label="Traffic">
      <div className="traffic-region-head">
        <h3>Traffic</h3>
        <span className="traffic-region-sub">requests/hour · last 24h</span>
      </div>
      <AreaChart
        series={trafficSeries}
        x={(d) => d.x}
        y={(d) => d.y}
        title="Requests per hour over last 24 hours"
        height={140}
        xTicks={6}
        yTicks={4}
        legend={false}
      />
    </section>
  )
}
