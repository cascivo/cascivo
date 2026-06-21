import { useCurrentFrame, useVideoConfig } from 'remotion'
import { pop, ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const ITEMS = [
  'WCAG 2.2 AA — CI-enforced',
  'APG-conformant patterns',
  'CVD-safe chart palettes',
  '≥44px touch targets',
  'Keyboard + NVDA / JAWS / VoiceOver',
  'RTL via CSS logical properties',
]

export const Accessibility: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <Stage glow={[color.success, color.accent]} align="start">
      <div style={riseIn(frame, 0)}>
        <Eyebrow tint={color.success}>Earned, not bolted on</Eyebrow>
      </div>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, ...riseIn(frame, 8) }}>
        Accessible <GradientText>by construction.</GradientText>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 70,
          rowGap: 30,
          width: '100%',
          marginTop: 24,
        }}
      >
        {ITEMS.map((item, i) => {
          const delay = 28 + i * 9
          const t = ramp(frame, delay, 14)
          const check = pop(frame, fps, delay + 4, { damping: 12 })
          return (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                fontSize: 40,
                fontWeight: 600,
                fontFamily: font.sans,
                color: color.text,
                opacity: t,
                transform: `translateY(${(1 - t) * 18}px)`,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: `${color.success}22`,
                  border: `2px solid ${color.success}`,
                  color: color.success,
                  fontSize: 30,
                  flexShrink: 0,
                  transform: `scale(${check})`,
                }}
              >
                ✓
              </span>
              {item}
            </div>
          )
        })}
      </div>
    </Stage>
  )
}
