import { useSignal, useSignals } from '@cascivo/core'
import { Button } from '../../button/button'
import { Card } from '../../card/card'
import { Checkbox } from '../../checkbox/checkbox'
import { Input } from '../../input/input'
import styles from './auth-signup.module.css'

export function AuthSignup() {
  useSignals()
  const name = useSignal('')
  const email = useSignal('')
  const password = useSignal('')
  const confirm = useSignal('')
  const terms = useSignal(false)

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <Card>
          <h1 className={styles.heading}>Create an account</h1>
          <p className={styles.subheading}>Get started with cascivo today</p>
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <div className={styles.field}>
              <label htmlFor="signup-name" className={styles.label}>
                Full name
              </label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Jane Smith"
                autoComplete="name"
                value={name.value}
                onChange={(e) => {
                  name.value = e.target.value
                }}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-email" className={styles.label}>
                Email
              </label>
              <Input
                id="signup-email"
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
              <label htmlFor="signup-password" className={styles.label}>
                Password
              </label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password.value}
                onChange={(e) => {
                  password.value = e.target.value
                }}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-confirm" className={styles.label}>
                Confirm password
              </label>
              <Input
                id="signup-confirm"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirm.value}
                onChange={(e) => {
                  confirm.value = e.target.value
                }}
              />
            </div>

            <div className={styles.termsRow}>
              <Checkbox
                id="signup-terms"
                checked={terms.value}
                onChange={(e) => {
                  terms.value = e.target.checked
                }}
              />
              <label htmlFor="signup-terms">
                I agree to the{' '}
                <a href="/terms" className={styles.termsLink}>
                  terms of service
                </a>{' '}
                and{' '}
                <a href="/privacy" className={styles.termsLink}>
                  privacy policy
                </a>
              </label>
            </div>

            <Button type="submit" variant="primary" style={{ inlineSize: '100%' }}>
              Create account
            </Button>
          </form>

          <p className={styles.footer}>
            Already have an account?{' '}
            <a href="/login" className={styles.footerLink}>
              Sign in
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}
