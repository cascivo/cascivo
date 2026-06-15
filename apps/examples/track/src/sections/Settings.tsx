'use client'
import { signal, useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@cascivo/react'
import { Preferences } from './settings/Preferences'
import { Workspace } from './settings/Workspace'
import { msg } from '../i18n'
import styles from './Settings.module.css'

const settingsTab = signal<'preferences' | 'workspace'>('preferences')

export function Settings() {
  useSignals()

  return (
    <div className={styles['root']}>
      <h1 className={styles['title']}>{t(msg.settingsTitle)}</h1>
      <Tabs
        value={settingsTab.value}
        onValueChange={(v) => {
          settingsTab.value = v as typeof settingsTab.value
        }}
      >
        <TabsList>
          <TabsTrigger value="preferences">{t(msg.settingsTabPreferences)}</TabsTrigger>
          <TabsTrigger value="workspace">{t(msg.settingsTabWorkspace)}</TabsTrigger>
        </TabsList>
        <TabsContent value="preferences">
          <Preferences />
        </TabsContent>
        <TabsContent value="workspace">
          <Workspace />
        </TabsContent>
      </Tabs>
    </div>
  )
}
