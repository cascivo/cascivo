'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { FileText, Gift, LifeBuoy, Percent, Sliders } from '@cascivo/icons'
import {
  Avatar,
  Card,
  DataList,
  HeaderPanel,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  User,
  useToast,
} from '@cascivo/react'
import type { CSSProperties, ReactNode } from 'react'
import { msg } from '../i18n'
import { money, signedPct } from '../format'
import { changePct } from '../store/market'
import { portfolioValue } from '../store/portfolio'
import { profileOpen } from '../store/ui'
import styles from './TopBar.module.css'

interface MenuItem {
  icon: ReactNode
  title: string
  hint: string
}

export function TopBar() {
  useSignals()
  const { toast } = useToast()
  const up = changePct.value >= 0
  // Measured at open time so the panel starts just below the avatar regardless
  // of the (variable-height) banner + header above it.
  const panelTop = useSignal(0)

  const items: MenuItem[] = [
    { icon: <LifeBuoy size={18} />, title: t(msg.getHelp), hint: t(msg.getHelpHint) },
    { icon: <Gift size={18} />, title: t(msg.invite), hint: t(msg.inviteHint) },
    { icon: <Percent size={18} />, title: t(msg.tax), hint: t(msg.taxHint) },
    { icon: <FileText size={18} />, title: t(msg.statements), hint: t(msg.statementsHint) },
    { icon: <Sliders size={18} />, title: t(msg.settings), hint: t(msg.settingsHint) },
  ]

  function stub() {
    toast({ title: t(msg.demoStub) })
    profileOpen.value = false
  }

  return (
    <div className={styles['bar']}>
      <span className={styles['pill']}>
        <span className={styles['tabnum']}>{money(portfolioValue.value)}</span>
        <span className={up ? styles['up'] : styles['down']}>{signedPct(changePct.value)}</span>
      </span>

      <button
        type="button"
        className={styles['avatarBtn']}
        aria-label={t(msg.openProfile)}
        aria-expanded={profileOpen.value}
        onClick={(e) => {
          panelTop.value = Math.round(e.currentTarget.getBoundingClientRect().bottom + 8)
          profileOpen.value = !profileOpen.value
        }}
      >
        <Avatar fallback="AU" size="sm" />
      </button>

      <div
        style={{ display: 'contents', '--trade-panel-top': `${panelTop.value}px` } as CSSProperties}
      >
        <HeaderPanel
          className={styles['profilePanel']}
          open={profileOpen.value}
          onClose={() => {
            profileOpen.value = false
          }}
          label={t(msg.profile)}
        >
          <div className={styles['panel']}>
            <Card variant="outlined" padding="md">
              <User
                name={t(msg.profileName)}
                description={t(msg.profile)}
                avatarProps={{ fallback: 'AU' }}
              />
            </Card>

            <div className={styles['twoUp']}>
              <Card variant="outlined" padding="md">
                <DataList
                  size="sm"
                  orientation="vertical"
                  items={[{ id: 'acc', label: t(msg.accounts), value: 'AU' }]}
                />
              </Card>
              <Card variant="outlined" padding="md">
                <DataList
                  size="sm"
                  orientation="vertical"
                  items={[{ id: 'nw', label: t(msg.netWorth), value: money(portfolioValue.value) }]}
                />
              </Card>
            </div>

            <Card variant="outlined" padding="none">
              <p className={styles['menuHead']}>{t(msg.profile)}</p>
              <ul className={styles['menu']}>
                {items.map((it) => (
                  <li key={it.title}>
                    <Item asChild size="sm">
                      <button type="button" className={styles['menuBtn']} onClick={stub}>
                        <ItemMedia>{it.icon}</ItemMedia>
                        <ItemContent>
                          <ItemTitle>{it.title}</ItemTitle>
                          <ItemDescription>{it.hint}</ItemDescription>
                        </ItemContent>
                      </button>
                    </Item>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </HeaderPanel>
      </div>
    </div>
  )
}
