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

export function Preferences() {
  useSignals()

  const displayName = useSignal('Adam Urban')
  const notificationsEnabled = useSignal(true)
  const pointerCursors = useSignal(false)
  const currentTheme = useSignal<'dark' | 'light'>(getAppTheme())

  return (
    <div className={styles['root']}>
      <section className={styles['section']}>
        <h2 className={styles['sectionTitle']}>{t(msg.prefSectionGeneral)}</h2>

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
    </div>
  )
}
