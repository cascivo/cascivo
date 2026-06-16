'use client'
import { useSignal, useSignals } from '@cascivo/core'
import { Button } from '../../button/button'
import { Input } from '../../input/input'
import { Textarea } from '../../textarea/textarea'
import { Toggle } from '../../toggle/toggle'
import styles from './settings-profile.module.css'

export function SettingsProfile() {
  useSignals()
  const name = useSignal('Jane Smith')
  const email = useSignal('jane@example.com')
  const bio = useSignal('')
  const emailNotifs = useSignal(true)
  const pushNotifs = useSignal(false)
  const weeklyDigest = useSignal(true)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>Manage your account preferences</p>
      </header>

      <div className={styles.body}>
        <section>
          <h2 className={styles.sectionTitle}>Personal info</h2>
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label htmlFor="settings-name" className={styles.label}>
                Name
              </label>
              <Input
                id="settings-name"
                type="text"
                value={name.value}
                onChange={(e) => {
                  name.value = e.target.value
                }}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="settings-email" className={styles.label}>
                Email
              </label>
              <Input
                id="settings-email"
                type="email"
                value={email.value}
                onChange={(e) => {
                  email.value = e.target.value
                }}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="settings-bio" className={styles.label}>
                Bio
              </label>
              <Textarea
                id="settings-bio"
                placeholder="Tell us about yourself…"
                rows={4}
                value={bio.value}
                onChange={(e) => {
                  bio.value = e.target.value
                }}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Preferences</h2>

          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Email notifications</p>
              <p className={styles.toggleDescription}>Receive updates via email</p>
            </div>
            <Toggle
              checked={emailNotifs.value}
              onChange={(checked) => {
                emailNotifs.value = checked
              }}
              aria-label="Email notifications"
            />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Push notifications</p>
              <p className={styles.toggleDescription}>Receive browser push notifications</p>
            </div>
            <Toggle
              checked={pushNotifs.value}
              onChange={(checked) => {
                pushNotifs.value = checked
              }}
              aria-label="Push notifications"
            />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <p className={styles.toggleLabel}>Weekly digest</p>
              <p className={styles.toggleDescription}>Receive a weekly activity summary</p>
            </div>
            <Toggle
              checked={weeklyDigest.value}
              onChange={(checked) => {
                weeklyDigest.value = checked
              }}
              aria-label="Weekly digest"
            />
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <Button variant="ghost" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => {}}>
          Save changes
        </Button>
      </footer>
    </div>
  )
}
