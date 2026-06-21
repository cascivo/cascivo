import { interpolate, useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const PAINS = [
  'Tailwind class soup',
  'useState re-render storms',
  'copy-paste sync debt',
  'hidden accessibility failures',
]

export const Problem: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <Stage glow={[color.danger, color.warning]} align="start">
      <div style={riseIn(frame, 0)}>
        <Eyebrow tint={color.danger}>The old way</Eyebrow>
      </div>
      <div
        style={{
          fontSize: 78,
          fontWeight: 800,
          lineHeight: 1.05,
          maxWidth: 1300,
          ...riseIn(frame, 8),
        }}
      >
        Most design systems make you choose what to give up.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 24 }}>
        {PAINS.map((pain, i) => {
          const delay = 34 + i * 12
          const appear = ramp(frame, delay, 12)
          const strike = ramp(frame, delay + 8, 16)
          return (
            <div
              key={pain}
              style={{
                position: 'relative',
                fontSize: 52,
                fontWeight: 600,
                color: color.textMuted,
                opacity: 0.35 + appear * 0.65,
                transform: `translateX(${(1 - appear) * 24}px)`,
                width: 'fit-content',
              }}
            >
              {pain}
              <span
                style={{
                  position: 'absolute',
                  insetBlockStart: '52%',
                  insetInlineStart: 0,
                  height: 4,
                  borderRadius: 4,
                  background: color.danger,
                  width: `${strike * 100}%`,
                }}
              />
            </div>
          )
        })}
      </div>
      <div
        style={{
          marginTop: 30,
          fontSize: 44,
          fontWeight: 700,
          fontFamily: font.sans,
          color: color.text,
          opacity: interpolate(frame, [96, 112], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        cascivo refuses the tradeoff.
      </div>
    </Stage>
  )
}
