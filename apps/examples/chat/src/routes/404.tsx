import { t } from '@cascivo/i18n'
import { Button, EmptyState } from '@cascivo/react'
import { newChat } from '../store'
import { msg } from '../i18n'

export default function NotFound() {
  return (
    <EmptyState
      title={t(msg.pageMissing)}
      description={t(msg.pageMissingDescription)}
      action={<Button onClick={newChat}>{t(msg.newChat)}</Button>}
    />
  )
}
