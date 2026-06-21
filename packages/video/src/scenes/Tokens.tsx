import { useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const LEVELS = [
  { label: 'Primitive', code: '--cascivo-blue-500: #3b82f6', note: 'raw value' },
  {
    label: 'Semantic',
    code: '--cascivo-color-accent: var(--cascivo-blue-500)',
    note: 'themes remap here',
  },
  {
    label: 'Component',
    code: '--cascivo-button-bg: var(--cascivo-color-accent)',
    note: 'you override here',
  },
]

export const Tokens: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <Stage glow={[color.accent, color.ai]} align="start">
      <div style={riseIn(frame, 0)}>
        <Eyebrow>Three-level tokens</Eyebrow>
      </div>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, ...riseIn(frame, 8) }}>
        Re-skin everything from <GradientText>one layer.</GradientText>
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%', marginTop: 16 }}
      >
        {LEVELS.map((level, i) => {
          const t = ramp(frame, 26 + i * 16, 18)
          return (
            <div key={level.label} style={{ position: 'relative' }}>
              {i > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    insetInlineStart: 230,
                    insetBlockStart: -22,
                    width: 3,
                    height: 22,
                    background: color.accentBright,
                    opacity: t,
                    transformOrigin: 'top',
                    transform: `scaleY(${ramp(frame, 26 + i * 16 - 6, 12)})`,
                  }}
                />
              ) : null}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 30,
                  padding: '26px 34px',
                  borderRadius: 18,
                  background: color.surface,
                  border: `1px solid ${color.border}`,
                  opacity: t,
                  transform: `translateX(${(1 - t) * 30}px)`,
                }}
              >
                <span
                  style={{
                    width: 200,
                    fontSize: 30,
                    fontWeight: 700,
                    color: color.accentBright,
                    fontFamily: font.sans,
                  }}
                >
                  {level.label}
                </span>
                <span style={{ flex: 1, fontFamily: font.mono, fontSize: 32, color: color.text }}>
                  {level.code}
                </span>
                <span style={{ fontSize: 24, color: color.textMuted, fontFamily: font.sans }}>
                  {level.note}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Stage>
  )
}
