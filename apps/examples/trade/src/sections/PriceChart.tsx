'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Candlestick } from '@cascivo/charts'
import { Button, Card, SegmentedControl, Stat } from '@cascivo/react'
import { msg } from '../i18n'
import { price, signedNumber, signedPct } from '../format'
import { INTERVAL_MS, type Candle } from '../data/candles'
import type { Interval } from '../data/instruments'
import {
  ask,
  bid,
  candles,
  changeAbs,
  changePct,
  lastPrice,
  prevClose,
  selectedInstrument,
} from '../store/market'
import { chartInterval, chartRange, RANGE_BARS, ticketSheetOpen, type Range } from '../store/ui'
import styles from './PriceChart.module.css'

const INTERVAL_OPTIONS = (['10m', '1h', 'D', 'W'] as Interval[]).map((v) => ({
  label: v,
  value: v,
}))
const RANGE_OPTIONS = (['1D', '1W', '1M', '3M', '1Y', 'Max'] as Range[]).map((v) => ({
  label: v,
  value: v,
}))

function labelFor(epoch: number, interval: Interval): string {
  const d = new Date(epoch)
  if (interval === '10m' || interval === '1h') {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
}

export function PriceChart() {
  useSignals()
  const interval = chartInterval.value
  const range = chartRange.value
  const all = candles.value[interval]
  const n = RANGE_BARS[range]
  const slice: Candle[] = Number.isFinite(n) ? all.slice(-n) : all
  const trend = changeAbs.value >= 0 ? 'up' : 'down'

  const data = slice.map((c) => ({
    t: labelFor(c.t, interval),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }))

  const last = Math.round(lastPrice.value * 100) / 100

  return (
    <Card padding="md" className={styles['panel']}>
      <div className={styles['header']}>
        <div className={styles['ident']}>
          <h2 className={styles['name']}>{selectedInstrument.value.name}</h2>
          <Stat
            label={selectedInstrument.value.code}
            value={price(lastPrice.value)}
            delta={`${signedNumber(changeAbs.value)} (${signedPct(changePct.value)})`}
            trend={trend}
          />
        </div>
        <div className={styles['quote']}>
          <span className={styles['tabnum']}>
            {t(msg.bidLabel)} {price(bid.value)}
          </span>
          <span className={styles['tabnum']}>
            {t(msg.askLabel)} {price(ask.value)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              ticketSheetOpen.value = true
            }}
          >
            {t(msg.chartTrade)}
          </Button>
        </div>
      </div>

      <div className={styles['controls']}>
        <SegmentedControl
          options={INTERVAL_OPTIONS}
          value={interval}
          onValueChange={(v) => {
            chartInterval.value = v as Interval
          }}
          size="sm"
          aria-label={t(msg.intervalLabel)}
        />
        <SegmentedControl
          options={RANGE_OPTIONS}
          value={range}
          onValueChange={(v) => {
            chartRange.value = v as Range
          }}
          size="sm"
          aria-label={t(msg.rangeLabel)}
        />
      </div>

      <Candlestick
        // Remount on interval/range change so the internal zoom window resets.
        key={`${interval}-${range}-${prevClose.value === 0 ? 'x' : selectedInstrument.value.id}`}
        data={data}
        title={selectedInstrument.value.name}
        description={`OHLC candles, ${interval} interval, ${INTERVAL_MS[interval] / 60000}-minute buckets`}
        height={360}
        volume
        zoom
        dataZoom
        tooltipMode="axis"
        upColor="var(--cascivo-color-success)"
        downColor="var(--cascivo-color-error)"
        annotations={[{ kind: 'line', axis: 'y', value: last, label: price(last) }]}
      />
    </Card>
  )
}
