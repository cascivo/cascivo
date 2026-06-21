import { useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { type CodeLine, CodeWindow } from '../components/CodeWindow'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const LINES: CodeLine[] = [
  { text: '@layer cascivo.components {', tint: color.accentBright },
  { text: '  .card {', tint: color.text },
  { text: '    container-type: inline-size;', tint: color.textMuted },
  { text: '    &:has(:focus-visible) {', tint: color.cyan },
  { text: '      outline: 2px solid var(--cascivo-color-accent);', tint: color.textMuted },
  { text: '    }', tint: color.text },
  { text: '  }', tint: color.text },
  { text: '  @container (min-width: 40rem) {', tint: color.cyan },
  { text: '    .card { grid-template-columns: 1fr 1fr; }', tint: color.textMuted },
  { text: '  }', tint: color.text },
  { text: '}', tint: color.accentBright },
]

const FEATURES = ['@layer', '@container', ':has()', 'custom properties', 'no build step']

export const ModernCss: React.FC = () => {
  const frame = useCurrentFrame()
  const revealed = Math.floor(ramp(frame, 30, 90) * LINES.length)

  return (
    <Stage glow={[color.accent, color.cyan]} align="start">
      <div style={riseIn(frame, 0)}>
        <Eyebrow>Modern CSS, not Tailwind</Eyebrow>
      </div>
      <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, ...riseIn(frame, 8) }}>
        Pure web standards. <GradientText>No utility soup.</GradientText>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 60,
          alignItems: 'center',
          width: '100%',
          marginTop: 18,
        }}
      >
        <div style={riseIn(frame, 20)}>
          <CodeWindow title="card.css" lines={LINES} revealed={revealed} accent={color.accent} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {FEATURES.map((feat, i) => {
            const t = ramp(frame, 50 + i * 9, 16)
            return (
              <div
                key={feat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  fontSize: 38,
                  fontWeight: 600,
                  fontFamily: font.mono,
                  color: color.text,
                  opacity: t,
                  transform: `translateX(${(1 - t) * 30}px)`,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: color.accentBright,
                    boxShadow: `0 0 18px ${color.accentBright}`,
                  }}
                />
                {feat}
              </div>
            )
          })}
        </div>
      </div>
    </Stage>
  )
}
