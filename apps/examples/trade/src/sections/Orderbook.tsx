'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Card, Stat, VisuallyHidden } from '@cascivo/react'
import { msg } from '../i18n'
import { price, qty } from '../format'
import { ask, bid, book } from '../store/market'
import { DepthBars } from './DepthBars'
import styles from './Orderbook.module.css'

export function Orderbook() {
  useSignals()
  const { bids, asks } = book.value
  const rows = Math.max(bids.length, asks.length)

  return (
    <Card padding="md" className={styles['panel']}>
      <h2 className={styles['title']}>{t(msg.orderbookTitle)}</h2>

      <div className={styles['best']}>
        <Stat label={t(msg.bestBid)} value={price(bid.value)} trend="up" />
        <Stat label={t(msg.bestAsk)} value={price(ask.value)} trend="down" />
      </div>

      <div className={styles['depthWrap']}>
        <DepthBars bids={bids} asks={asks} />
        <VisuallyHidden>
          {t(msg.depthSummary, {
            bid: price(bid.value),
            ask: price(ask.value),
            levels: String(rows),
          })}
        </VisuallyHidden>
      </div>

      <table className={styles['ladder']}>
        <thead>
          <tr>
            <th className={styles['num']}>{t(msg.size)}</th>
            <th className={styles['num']}>{t(msg.price)}</th>
            <th className={styles['num']}>{t(msg.price)}</th>
            <th className={styles['num']}>{t(msg.size)}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => {
            const b = bids[i]
            const a = asks[i]
            return (
              <tr key={i}>
                <td className={styles['num']}>{b ? qty(b.size) : ''}</td>
                <td className={`${styles['num']} ${styles['bid']}`}>{b ? price(b.price) : ''}</td>
                <td className={`${styles['num']} ${styles['ask']}`}>{a ? price(a.price) : ''}</td>
                <td className={styles['num']}>{a ? qty(a.size) : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className={styles['footnote']}>{t(msg.orderbookFootnote)}</p>
    </Card>
  )
}
