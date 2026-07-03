'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, Sheet, ToastProvider } from '@cascivo/react'
import type { CommandGroup, SideNavItem } from '@cascivo/react'
import { AppShell, useSimulation } from '@cascivo/example-kit'
import { msg } from './i18n'
import { INSTRUMENTS } from './data/instruments'
import { marketSim } from './sim/market'
import { selectInstrument, selectedInstrumentId } from './store/market'
import { ticketSheetOpen } from './store/ui'
import { TopBar } from './sections/TopBar'
import { PriceChart } from './sections/PriceChart'
import { OrderTicket } from './sections/OrderTicket'
import { InstrumentSummary } from './sections/InstrumentSummary'
import { Orderbook } from './sections/Orderbook'
import { TimeAndSales } from './sections/TimeAndSales'
import { OrdersTable } from './sections/OrdersTable'
import styles from './App.module.css'

import '@cascivo/themes/dark'
import '@cascivo/themes/light'
import '@cascivo/themes/warm'
import '@cascivo/tokens'

export default function App() {
  useSignals()
  useSimulation(marketSim)

  const navItems: SideNavItem[] = [
    {
      label: t(msg.navTrading),
      active: true,
      onClick: (e) => e.preventDefault(),
    },
    {
      label: t(msg.navResearch),
      active: false,
      onClick: (e) => e.preventDefault(),
    },
  ]

  const commandGroups: CommandGroup[] = [
    {
      heading: t(msg.summaryTitle),
      items: INSTRUMENTS.map((inst) => ({
        id: inst.id,
        label: inst.name,
        keywords: [inst.code],
        onSelect: () => selectInstrument(inst.id),
      })),
    },
  ]

  const actions = (
    <div className={styles['headerActions']}>
      {marketSim.running.value && <span className={styles['live']}>{t(msg.live)}</span>}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          marketSim.toggle()
        }}
      >
        {marketSim.running.value ? t(msg.pause) : t(msg.resume)}
      </Button>
      <TopBar />
    </div>
  )

  return (
    <ToastProvider>
      <AppShell
        navItems={navItems}
        commandGroups={commandGroups}
        actions={actions}
        brand={{ name: t(msg.appTitle) }}
        mockBanner
      >
        <div className={styles['grid']}>
          <div className={styles['chart']}>
            <PriceChart />
          </div>
          <div className={styles['ticketInline']}>
            <OrderTicket />
          </div>
          <div className={styles['summary']}>
            <InstrumentSummary />
          </div>
          <div className={styles['orderbook']}>
            <Orderbook />
          </div>
          <div className={styles['tape']}>
            <TimeAndSales />
          </div>
          <div className={styles['orders']}>
            <OrdersTable />
          </div>
        </div>

        <div className={styles['tradeSticky']}>
          <Button
            onClick={() => {
              ticketSheetOpen.value = true
            }}
          >
            {t(msg.chartTrade)}
          </Button>
        </div>

        <Sheet
          open={ticketSheetOpen.value}
          onClose={() => {
            ticketSheetOpen.value = false
          }}
          side="bottom"
          title={t(msg.ticketTitle)}
        >
          <OrderTicket key={`sheet-${selectedInstrumentId.value}`} />
        </Sheet>
      </AppShell>
    </ToastProvider>
  )
}
