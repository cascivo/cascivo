'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Card, ScrollArea } from '@cascivo/react'
import { msg } from '../i18n'
import { clock, price, qty } from '../format'
import { tape } from '../store/market'
import styles from './TimeAndSales.module.css'

export function TimeAndSales() {
  useSignals()
  const trades = tape.signal.value
  // Tag each trade up/down vs the previous (older) trade, then show newest first.
  const rows = trades
    .map((tr, i) => ({ tr, up: i === 0 ? true : tr.price >= trades[i - 1]!.price }))
    .reverse()

  return (
    <Card padding="md" className={styles['panel']}>
      <h2 className={styles['title']}>{t(msg.tapeTitle)}</h2>
      <div className={styles['head']}>
        <span>{t(msg.time)}</span>
        <span className={styles['num']}>{t(msg.price)}</span>
        <span className={styles['num']}>{t(msg.size)}</span>
      </div>
      <ScrollArea className={styles['tapeScroll']}>
        <ul className={styles['list']}>
          {rows.map(({ tr, up }) => (
            <li key={tr.id} className={styles['row']}>
              <span className={styles['time']}>{clock(tr.time)}</span>
              <span className={`${styles['num']} ${up ? styles['up'] : styles['down']}`}>
                {price(tr.price)}
              </span>
              <span className={styles['num']}>{qty(tr.size)}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </Card>
  )
}
