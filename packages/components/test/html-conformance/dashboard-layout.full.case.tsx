import { DashboardLayout } from '../../../layouts/src/dashboard-layout/dashboard-layout'
import { Separator } from '../../src/separator/separator'

export default (
  <DashboardLayout
    stats="S&"
    aside="<A>"
    main={
      <>
        M
        <Separator />
      </>
    }
  />
)
