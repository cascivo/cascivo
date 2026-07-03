'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Meter, Sparkline } from '@cascivo/charts'
import {
  Card,
  DataList,
  EmptyState,
  SegmentedControl,
  Stat,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@cascivo/react'
import { msg } from '../i18n'
import { money, price, qty, signedPct } from '../format'
import { candles, changeAbs, dayHigh, dayLow, lastPrice, prevClose } from '../store/market'
import { activityCount, positionValue, returnPct } from '../store/portfolio'
import { RANGE_BARS, summaryRange, type Range } from '../store/ui'
import styles from './InstrumentSummary.module.css'

const RANGE_OPTIONS = (['1D', '1W', '1M', '1Y', 'Max'] as Range[]).map((v) => ({
  label: v,
  value: v,
}))

export function InstrumentSummary() {
  useSignals()
  const daily = candles.value.D
  const n = RANGE_BARS[summaryRange.value]
  const window = Number.isFinite(n) ? daily.slice(-n) : daily
  const closes = window.map((c) => c.close)
  const rising = closes.length > 1 && closes[closes.length - 1]! >= closes[0]!
  const sparkColor = rising ? 'var(--cascivo-color-success)' : 'var(--cascivo-color-error)'
  const last = window[window.length - 1]

  return (
    <Card padding="md" className={styles['panel']}>
      <h2 className={styles['title']}>{t(msg.summaryTitle)}</h2>
      <Stat
        label={t(msg.price)}
        value={price(lastPrice.value)}
        trend={changeAbs.value >= 0 ? 'up' : 'down'}
      />

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{t(msg.tabSummary)}</TabsTrigger>
          <TabsTrigger value="insights">{t(msg.tabInsights)}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className={styles['summary']}>
            <SegmentedControl
              options={RANGE_OPTIONS}
              value={summaryRange.value}
              onValueChange={(v) => {
                summaryRange.value = v as Range
              }}
              size="sm"
              aria-label={t(msg.rangeLabel)}
            />
            <Sparkline
              data={closes}
              label={`${t(msg.summaryTitle)} ${summaryRange.value}`}
              height={48}
              color={sparkColor}
            />

            <div className={styles['stats']}>
              <Stat label={t(msg.position)} value={money(positionValue.value)} />
              <Stat
                label={t(msg.returnLabel)}
                value={signedPct(returnPct.value)}
                trend={returnPct.value >= 0 ? 'up' : 'down'}
              />
              <Stat label={t(msg.activity)} value={qty(activityCount.value)} />
            </div>

            <h3 className={styles['subhead']}>{t(msg.keyStats)}</h3>
            <DataList
              size="sm"
              items={[
                { id: 'prev', label: t(msg.prevClose), value: price(prevClose.value) },
                { id: 'open', label: t(msg.open), value: price(last?.open ?? lastPrice.value) },
                { id: 'vol', label: t(msg.volume), value: qty(last?.volume ?? 0) },
              ]}
            />
            <Meter
              value={lastPrice.value}
              min={dayLow.value}
              max={dayHigh.value}
              label={`${t(msg.daysRange)} ${price(dayLow.value)}–${price(dayHigh.value)}`}
            />
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <EmptyState
            size="md"
            title={t(msg.insightsEmpty)}
            description={t(msg.insightsEmptyHint)}
          />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
