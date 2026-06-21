import { interpolate, useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { MockCard, THEMES } from '../components/Mockups'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const HOLD = 56

export const Themes: React.FC = () => {
  const frame = useCurrentFrame()
  const start = 26
  const step = Math.max(0, Math.floor((frame - start) / HOLD))
  const index = step % THEMES.length
  const theme = THEMES[index] ?? THEMES[0]!
  const local = (frame - start) % HOLD
  const swap = interpolate(local, [0, 8, HOLD - 8, HOLD], [0.6, 1, 1, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <Stage glow={[color.ai, color.accent]}>
      <div style={riseIn(frame, 0)}>
        <Eyebrow tint={color.aiBright}>Beautiful by default</Eyebrow>
      </div>
      <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, ...riseIn(frame, 8) }}>
        14 themes. <GradientText variant="ai">One attribute.</GradientText>
      </div>
      <div
        style={{
          marginTop: 20,
          padding: 70,
          borderRadius: 30,
          background: theme.vars.bg,
          border: `1px solid ${color.borderStrong}`,
          boxShadow: '0 50px 130px rgba(0, 0, 0, 0.55)',
          transition: 'none',
          opacity: ramp(frame, 22, 18),
          transform: `scale(${0.96 + ramp(frame, 22, 18) * 0.04})`,
        }}
      >
        <div style={{ transform: `scale(${0.97 + swap * 0.03})`, opacity: swap }}>
          <MockCard t={theme.vars} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          fontFamily: font.mono,
          fontSize: 34,
          color: color.textMuted,
          opacity: ramp(frame, 30, 16),
        }}
      >
        <span style={{ color: color.textFaint }}>{'<main'}</span>
        <span style={{ color: color.text }}>data-theme=</span>
        <span style={{ color: color.accentBright }}>"{theme.name}"</span>
        <span style={{ color: color.textFaint }}>{'>'}</span>
      </div>
    </Stage>
  )
}
