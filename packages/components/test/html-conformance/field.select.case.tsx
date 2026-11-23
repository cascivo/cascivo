import { Field } from '../../src/field/field'
import { Select } from '../../src/select/select'

export default (
  <Field label="Plan" hint="Billed monthly" id="plan">
    <Select
      options={[
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
      ]}
    />
  </Field>
)
