import { Button } from '../../src/button/button'
import styles from '../../src/button/button.module.css'

export default (
  <Button asChild variant="secondary">
    <a href="/pricing">
      <span className={styles['label']}>Pricing</span>
    </a>
  </Button>
)
