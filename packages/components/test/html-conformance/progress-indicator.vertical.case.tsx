import { ProgressIndicator } from '../../src/progress-indicator/progress-indicator'

export default (
  <ProgressIndicator
    vertical
    steps={[{ label: 'Account', description: 'Your details' }, { label: 'Confirm' }]}
    currentIndex={0}
  />
)
