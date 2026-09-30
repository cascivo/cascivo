import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { RouterView } from '@cascivo/app'
import { Spinner } from '@cascivo/react'
import type { SideNavItem } from '@cascivo/react'
import { MessageSquare } from '@cascivo/icons'
import { AppShell } from '@cascivo/example-kit'
import { router } from './router'
import { activeId, chatPath, conversations, sortedConversations } from './store'
import { msg } from './i18n'
import styles from './App.module.css'

import '@cascivo/tokens'
import '@cascivo/themes/dark.css'
import '@cascivo/themes/light.css'
import '@cascivo/themes/warm.css'

export default function App() {
  useSignals()

  // Real links: `main.tsx` registers the router's Link with setLinkComponent, so SideNav
  // navigates client-side while middle-click and "open in new tab" still work.
  const navItems: SideNavItem[] = sortedConversations.value.map((c) => ({
    id: c.id,
    label: c.title,
    href: chatPath(c.id),
    icon: <MessageSquare size={16} />,
    active: c.id === activeId.value,
  }))

  const loading = (
    <div className={styles['loading']}>
      <Spinner label={t(msg.loading)} />
    </div>
  )

  return (
    <AppShell brand={{ name: t(msg.appTitle) }} navItems={navItems}>
      {conversations.ready.value ? <RouterView router={router} fallback={loading} /> : loading}
    </AppShell>
  )
}
