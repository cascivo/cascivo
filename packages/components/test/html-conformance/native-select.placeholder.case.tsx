import { NativeSelect } from '../../src/native-select/native-select'

export default (
  <NativeSelect
    placeholder="Pick"
    size="sm"
    options={[
      { value: 'free', label: 'Free' },
      { value: 'pro', label: 'Pro', disabled: true },
    ]}
  />
)
