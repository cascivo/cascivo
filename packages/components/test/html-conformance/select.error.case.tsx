import { Select } from '../../src/select/select'

export default (
  <Select
    label="Plan"
    defaultValue="pro"
    error="Pick one"
    size="sm"
    required
    options={[
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ]}
  />
)
