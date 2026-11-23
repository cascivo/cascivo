import { Select } from '../../src/select/select'

export default (
  <Select label="Plan" placeholder="Choose" hint="Billed monthly" name="plan" options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]} />
)
