import { useSignal, useSignals } from '@cascivo/core'
import { Button } from '../../button/button'
import { Card } from '../../card/card'
import { Checkbox } from '../../checkbox/checkbox'
import { Input } from '../../input/input'
import styles from './auth-login.module.css'

export function AuthLogin() {
  useSignals()
  const email = useSignal('')
  const password = useSignal('')
  const remember = useSignal(false)

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <Card>
          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.subheading}>Enter your credentials to continue</p>
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email.value}
                onChange={(e) => {
                  email.value = e.target.value
                }}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.passwordRow}>
                <label htmlFor="login-password" className={styles.label}>
                  Password
                </label>
                <a href="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </a>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password.value}
                onChange={(e) => {
                  password.value = e.target.value
                }}
              />
            </div>

            <div className={styles.rememberRow}>
              <Checkbox
                id="login-remember"
                label="Remember me"
                checked={remember.value}
                onChange={(e) => {
                  remember.value = e.target.checked
                }}
              />
            </div>

            <Button type="submit" variant="primary" style={{ inlineSize: '100%' }}>
              Sign in
            </Button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account?{' '}
            <a href="/signup" className={styles.footerLink}>
              Create an account
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}
