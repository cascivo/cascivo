'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Gift,
  LifeBuoy,
  Percent,
  Sliders,
} from '@cascivo/icons'
import {
  Avatar,
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
import { profileOpen, profileView } from '../store/ui'
import styles from './TopBar.module.css'

interface MenuEntry {
  id: string
  icon: ReactNode
  title: string
  hint: string
  sub: string[]
}

export function TopBar() {
  useSignals()
  const { toast } = useToast()
  const up = changePct.value >= 0
  const panelTop = useSignal(0)

  const entries: MenuEntry[] = [
    {
      id: 'help',
      icon: <LifeBuoy size={18} />,
      title: t(msg.getHelp),
      hint: t(msg.getHelpHint),
      sub: [t(msg.helpSub1), t(msg.helpSub2), t(msg.helpSub3)],
    },
    {
      id: 'invite',
      icon: <Gift size={18} />,
      title: t(msg.invite),
      hint: t(msg.inviteHint),
      sub: [t(msg.inviteSub1), t(msg.inviteSub2), t(msg.inviteSub3)],
    },
    {
      id: 'tax',
      icon: <Percent size={18} />,
      title: t(msg.tax),
      hint: t(msg.taxHint),
      sub: [t(msg.taxSub1), t(msg.taxSub2), t(msg.taxSub3)],
    },
    {
      id: 'statements',
      icon: <FileText size={18} />,
      title: t(msg.statements),
      hint: t(msg.statementsHint),
      sub: [t(msg.statementsSub1), t(msg.statementsSub2), t(msg.statementsSub3)],
    },
    {
      id: 'settings',
      icon: <Sliders size={18} />,
      title: t(msg.settings),
      hint: t(msg.settingsHint),
      sub: [t(msg.settingsSub1), t(msg.settingsSub2), t(msg.settingsSub3)],
    },
  ]

  function close() {
    profileOpen.value = false
    profileView.value = null
  }
  function stub() {
    toast({ title: t(msg.demoStub) })
    close()
  }

  const active = entries.find((e) => e.id === profileView.value)

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
          profileView.value = null
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
          onClose={close}
          label={t(msg.profile)}
        >
          {active ? (
            // ── Submenu — replaces the main menu, same style, with a Back button.
            <div className={styles['panel']}>
              <button
                type="button"
                className={styles['back']}
                onClick={() => {
                  profileView.value = null
                }}
              >
                <ChevronLeft size={16} />
                <span>{t(msg.back)}</span>
              </button>
              <p className={styles['viewTitle']}>{active.title}</p>
              <ul className={styles['menu']}>
                {active.sub.map((label) => (
                  <li key={label}>
                    <Item asChild size="sm">
                      <button type="button" className={styles['menuBtn']} onClick={stub}>
                        <ItemContent>
                          <ItemTitle>{label}</ItemTitle>
                        </ItemContent>
                      </button>
                    </Item>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // ── Main menu.
            <div className={styles['panel']}>
              <div className={styles['profileRow']}>
                <User
                  name={t(msg.profileName)}
                  description={t(msg.profile)}
                  avatarProps={{ fallback: 'AU' }}
                />
              </div>

              <div className={styles['twoUp']}>
                <div className={styles['stat']}>
                  <DataList
                    size="sm"
                    orientation="vertical"
                    items={[{ id: 'acc', label: t(msg.accounts), value: 'AU' }]}
                  />
                </div>
                <div className={styles['stat']}>
                  <DataList
                    size="sm"
                    orientation="vertical"
                    items={[
                      { id: 'nw', label: t(msg.netWorth), value: money(portfolioValue.value) },
                    ]}
                  />
                </div>
              </div>

              <ul className={styles['menu']}>
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <Item asChild size="sm">
                      <button
                        type="button"
                        className={styles['menuBtn']}
                        onClick={() => {
                          profileView.value = entry.id
                        }}
                      >
                        <ItemMedia>{entry.icon}</ItemMedia>
                        <ItemContent>
                          <ItemTitle>{entry.title}</ItemTitle>
                          <ItemDescription>{entry.hint}</ItemDescription>
                        </ItemContent>
                        <span className={styles['chevron']} aria-hidden="true">
                          <ChevronRight size={16} />
                        </span>
                      </button>
                    </Item>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </HeaderPanel>
      </div>
    </div>
  )
}
