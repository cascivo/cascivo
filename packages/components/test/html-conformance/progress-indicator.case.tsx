import { ProgressIndicator } from '../../src/progress-indicator/progress-indicator'

export default (
  <ProgressIndicator
    steps={[{ label: 'Cart' }, { label: 'Pay' }, { label: 'Done' }]}
    currentIndex={1}
  />
)
