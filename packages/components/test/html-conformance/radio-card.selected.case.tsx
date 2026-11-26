import { RadioCard, RadioCardGroup } from '../../src/radio-card/radio-card'

export default (
  <RadioCardGroup name="plan" label="Plan" value="pro">
    <RadioCard value="free" title="Free" disabled />
    <RadioCard value="pro" title="Pro" disabled />
  </RadioCardGroup>
)
