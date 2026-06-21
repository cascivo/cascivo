import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { pop, ramp } from '../anim'
import { Background } from '../components/Background'
import { GradientText } from '../components/GradientText'
import { Mark } from '../components/Mark'
import { color, font } from '../theme'

const LINKS = ['cascivo.com', 'docs.cascivo.com', 'github.com/cascivo/cascivo']

export const Cta: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const mark = pop(frame, fps, 4, { damping: 24 })

  return (
    <AbsoluteFill style={{ fontFamily: font.sans }}>
      <Background glow={[color.accent, color.ai]} />
      <AbsoluteFill
        style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 36 }}
      >
        <div style={{ transform: `scale(${mark})` }}>
          <Mark size={120} progress={mark} />
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, opacity: ramp(frame, 16, 18) }}>
          You <GradientText>own</GradientText> the code.
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 18,
            padding: '22px 38px',
            borderRadius: 16,
            background: color.surface,
            border: `1px solid ${color.borderStrong}`,
            fontFamily: font.mono,
            fontSize: 44,
            color: color.text,
            opacity: ramp(frame, 30, 18),
          }}
        >
          <span style={{ color: color.textFaint }}>$</span>
          <span>npx cascivo init</span>
        </div>
        <div style={{ display: 'flex', gap: 40, marginTop: 16, opacity: ramp(frame, 46, 20) }}>
          {LINKS.map((link, i) => (
            <span
              key={link}
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: i === 0 ? color.accentBright : color.textMuted,
              }}
            >
              {link}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
