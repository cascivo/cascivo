import { Activity, AlertTriangle, Dashboard, Settings, Tag, Zap } from '@cascade-ui/icons'
import { SideNav } from '@cascade-ui/components/side-nav'
import registry from '../../../../registry.json'
import { DeploysRegion } from './DeploysRegion'
import { FlagsRegion } from './FlagsRegion'
import { KpiRow } from './KpiRow'
import { SideRegion } from './SideRegion'
import { TrafficRegion } from './TrafficRegion'
import { NAV } from './data'

const componentCount = (registry as { components: unknown[] }).components.length

const NAV_ICONS: Record<(typeof NAV)[number], React.ReactNode> = {
  Overview: <Dashboard />,
  Deploys: <Zap />,
  Incidents: <AlertTriangle />,
  Traffic: <Activity />,
  Flags: <Tag />,
  Settings: <Settings />,
}

const navItems = NAV.map((label, i) => ({
  label,
  icon: NAV_ICONS[label as (typeof NAV)[number]],
  active: i === 0,
}))

export function RelayConsole() {
  return (
    <section className="console" id="console" aria-label="Live demo — Relay deploy console">
      <p className="console-note">
        The console below is live — 25+ cascade components, real markup. Switch the theme in the
        header; the on-call card stays <code>data-theme=&quot;warm&quot;</code> on purpose.
      </p>
      <div className="console-frame">
        <header className="console-titlebar">
          <span className="console-brand">Relay</span>
          <span className="console-env">production · eu-central</span>
        </header>
        <div className="console-body">
          <SideNav items={navItems} ariaLabel="Relay" defaultCollapsed />
          <main className="console-main">
            <KpiRow />
            <div className="console-grid">
              <TrafficRegion />
              <SideRegion />
              <DeploysRegion />
              <FlagsRegion />
            </div>
          </main>
        </div>
      </div>
      <p className="console-after">
        Built from <a href="/docs">{componentCount}+ components</a> — this page imports them like
        any app.
      </p>
    </section>
  )
}
