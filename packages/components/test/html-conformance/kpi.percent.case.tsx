import { Kpi } from '../../../charts/src/charts/kpi/kpi'

export default (
  <Kpi
    label="Churn"
    value="2%"
    delta={-3.25}
    deltaFormat="percent"
    goodDirection="down"
    deltaLabel="vs last week"
    icon="*"
  />
)
