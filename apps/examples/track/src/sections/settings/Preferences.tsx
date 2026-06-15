'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Input, Toggle, Select, RadioGroup, Radio } from '@cascivo/react'
import { setAppTheme, getAppTheme } from '@cascivo/example-kit'
import { msg } from '../../i18n'
import styles from './Preferences.module.css'

const FONT_SIZE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
]

const DEFAULT_VIEW_OPTIONS = [
  { value: 'my-issues', label: t(msg.prefDefaultViewMyIssues) },
  { value: 'inbox', label: t(msg.prefDefaultViewInbox) },
]

const FIRST_DAY_OPTIONS = [
  { value: 'monday', label: t(msg.prefFirstDayMonday) },
  { value: 'sunday', label: t(msg.prefFirstDaySunday) },
]

export function Preferences() {
  useSignals()

  const displayName = useSignal('Adam Urban')
  const notificationsEnabled = useSignal(true)
  const pointerCursors = useSignal(false)
  const ctrlEnter = useSignal(false)
  const desktopNotif = useSignal(false)
  const autoAssign = useSignal(true)
  const currentTheme = useSignal<'dark' | 'light'>(getAppTheme())

  return (
    <div className={styles['root']}>
      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(msg.prefSectionGeneral)}</h2>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefDefaultView)}</span>
            <p className={styles['desc']}>{t(msg.prefDefaultViewDesc)}</p>
          </div>
          <Select
            options={DEFAULT_VIEW_OPTIONS}
            value="my-issues"
            onChange={() => {}}
            aria-label={t(msg.prefDefaultView)}
          />
        </div>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <label htmlFor="display-name" className={styles['label']}>
              {t(msg.prefDisplayName)}
            </label>
            <p className={styles['desc']}>{t(msg.prefDisplayNameDesc)}</p>
          </div>
          <Input
            id="display-name"
            value={displayName.value}
            onChange={(e) => {
              displayName.value = e.target.value
            }}
          />
        </div>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefFirstDayOfWeek)}</span>
            <p className={styles['desc']}>{t(msg.prefFirstDayOfWeekDesc)}</p>
          </div>
          <Select
            options={FIRST_DAY_OPTIONS}
            value="monday"
            onChange={() => {}}
            aria-label={t(msg.prefFirstDayOfWeek)}
          />
        </div>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefNotifications)}</span>
            <p className={styles['desc']}>{t(msg.prefNotificationsDesc)}</p>
          </div>
          <Toggle
            checked={notificationsEnabled.value}
            onChange={(v) => {
              notificationsEnabled.value = v
            }}
            aria-label={t(msg.prefNotifications)}
          />
        </div>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefCtrlEnter)}</span>
            <p className={styles['desc']}>{t(msg.prefCtrlEnterDesc)}</p>
          </div>
          <Toggle
            checked={ctrlEnter.value}
            onChange={(v) => {
              ctrlEnter.value = v
            }}
            aria-label={t(msg.prefCtrlEnter)}
          />
        </div>
      </section>

      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(msg.prefSectionTheme)}</h2>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefFontSize)}</span>
            <p className={styles['desc']}>{t(msg.prefFontSizeDesc)}</p>
          </div>
          <Select
            options={FONT_SIZE_OPTIONS}
            value="default"
            onChange={() => {}}
            aria-label={t(msg.prefFontSize)}
          />
        </div>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefPointerCursors)}</span>
            <p className={styles['desc']}>{t(msg.prefPointerCursorsDesc)}</p>
          </div>
          <Toggle
            checked={pointerCursors.value}
            onChange={(v) => {
              pointerCursors.value = v
            }}
            aria-label={t(msg.prefPointerCursors)}
          />
        </div>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefThemeLabel)}</span>
            <p className={styles['desc']}>{t(msg.prefThemeDesc)}</p>
          </div>
          <RadioGroup
            name="app-theme"
            value={currentTheme.value}
            onChange={(v) => {
              currentTheme.value = v as 'dark' | 'light'
              setAppTheme(v as 'dark' | 'light')
            }}
          >
            <Radio value="light" label={t(msg.prefThemeLight)} />
            <Radio value="dark" label={t(msg.prefThemeDark)} />
          </RadioGroup>
        </div>
      </section>

      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(msg.prefSectionDesktop)}</h2>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefDesktopNotif)}</span>
            <p className={styles['desc']}>{t(msg.prefDesktopNotifDesc)}</p>
          </div>
          <Toggle
            checked={desktopNotif.value}
            onChange={(v) => {
              desktopNotif.value = v
            }}
            aria-label={t(msg.prefDesktopNotif)}
          />
        </div>
      </section>

      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(msg.prefSectionAutomations)}</h2>

        <div className={styles['row']}>
          <div className={styles['rowLabel']}>
            <span className={styles['label']}>{t(msg.prefAutoAssign)}</span>
            <p className={styles['desc']}>{t(msg.prefAutoAssignDesc)}</p>
          </div>
          <Toggle
            checked={autoAssign.value}
            onChange={(v) => {
              autoAssign.value = v
            }}
            aria-label={t(msg.prefAutoAssign)}
          />
        </div>
      </section>
    </div>
  )
}
