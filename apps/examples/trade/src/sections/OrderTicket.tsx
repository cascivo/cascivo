'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import {
  Button,
  Card,
  DataList,
  NumberInput,
  Select,
  SegmentedControl,
  useToast,
} from '@cascivo/react'
import { msg } from '../i18n'
import { money } from '../format'
import { selectedInstrument } from '../store/market'
import { cash } from '../store/portfolio'
import {
  fees,
  limitPrice,
  orderType,
  shares,
  sharesError,
  side,
  submit,
  total,
  validity,
  canSubmit,
  type OrderType,
  type Side,
  type Validity,
} from '../store/ticket'
import { ticketSheetOpen } from '../store/ui'
import styles from './OrderTicket.module.css'

const SIDE_OPTIONS = [
  { label: msg.sideBuy, value: 'buy' as Side },
  { label: msg.sideSell, value: 'sell' as Side },
]
const TYPE_OPTIONS = [
  { value: 'market' as OrderType, label: msg.typeMarket },
  { value: 'limit' as OrderType, label: msg.typeLimit },
  { value: 'stop' as OrderType, label: msg.typeStop },
]
const VALIDITY_OPTIONS = [
  { value: 'today' as Validity, label: msg.validityToday },
  { value: 'gtc' as Validity, label: msg.validityGtc },
]

export function OrderTicket() {
  useSignals()
  const { toast } = useToast()
  const isBuy = side.value === 'buy'
  const err = sharesError.value

  const errorText =
    err === 'exceeds-cash'
      ? t(msg.errCash)
      : err === 'exceeds-holdings'
        ? t(msg.errHoldings)
        : undefined

  function onSubmit() {
    const order = submit()
    if (!order) return
    toast({
      title: t(msg.filledTitle),
      description: t(msg.filledBody, {
        side: t(isBuy ? msg.sideBuy : msg.sideSell),
        shares: String(order.shares),
        name: selectedInstrument.value.name,
      }),
      variant: 'success',
    })
    ticketSheetOpen.value = false
  }

  return (
    <Card padding="md" className={styles['ticket']}>
      <h2 className={styles['title']}>{t(msg.ticketTitle)}</h2>

      <SegmentedControl
        options={SIDE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
        value={side.value}
        onValueChange={(v) => {
          side.value = v as Side
        }}
        size="md"
        aria-label={t(msg.ticketTitle)}
      />

      <Select
        label={t(msg.orderType)}
        options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))}
        value={orderType.value}
        onChange={(e) => {
          orderType.value = e.currentTarget.value as OrderType
        }}
        size="sm"
      />

      {orderType.value !== 'market' && (
        <NumberInput
          label={t(msg.limitPrice)}
          value={limitPrice.value}
          onChange={(v) => {
            limitPrice.value = v
          }}
          min={0}
          step={0.01}
          precision={2}
          size="sm"
        />
      )}

      <Select
        label={t(msg.validity)}
        options={VALIDITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.label) }))}
        value={validity.value}
        onChange={(e) => {
          validity.value = e.currentTarget.value as Validity
        }}
        size="sm"
      />

      <NumberInput
        label={t(msg.shares)}
        value={shares.value}
        onChange={(v) => {
          shares.value = v
        }}
        min={0}
        step={1}
        precision={0}
        size="sm"
        {...(errorText ? { error: errorText } : {})}
      />

      <DataList
        size="sm"
        items={[
          { id: 'fees', label: t(msg.fees), value: money(fees.value) },
          { id: 'total', label: t(msg.total), value: money(total.value) },
          { id: 'cash', label: t(msg.available), value: money(cash.value) },
        ]}
      />

      <p className={styles['disclaimer']}>{t(msg.disclaimer)}</p>

      <Button
        variant={isBuy ? 'primary' : 'destructive'}
        onClick={onSubmit}
        disabled={!canSubmit.value}
      >
        {isBuy ? t(msg.submitBuy) : t(msg.submitSell)}
      </Button>
    </Card>
  )
}
