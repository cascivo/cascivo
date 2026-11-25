import { NativeSelect } from '../../src/native-select/native-select'

export default (
  <NativeSelect
    invalid
    disabled
    required
    value="pro"
    onChange={() => {}}
    options={[
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro' },
    ]}
  />
)
