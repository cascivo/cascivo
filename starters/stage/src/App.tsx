import { RouterView } from '@cascivo/app'
import { Spinner, ToastProvider } from '@cascivo/react'
import { t } from '@cascivo/i18n'
import { msg } from './i18n'
import { router } from './router'
import styles from './App.module.css'

export default function App() {
  return (
    <ToastProvider>
      <RouterView
        router={router}
        fallback={
          <div className={styles['loading']}>
            <Spinner label={t(msg.connecting)} />
          </div>
        }
      />
    </ToastProvider>
  )
}
