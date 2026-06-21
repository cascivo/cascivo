import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { pop, ramp, tailFade } from '../anim'
import { Background } from '../components/Background'
import { GradientText } from '../components/GradientText'
import { Mark } from '../components/Mark'
import { color, font } from '../theme'

const TAGS = ['CSS-native', 'Signal-driven', 'AI-first']

export const LogoReveal: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const build = pop(frame, fps, 6, { damping: 26 })
  const wordmark = ramp(frame, 24, 22)
  const exit = tailFade(frame, durationInFrames)

  return (
    <AbsoluteFill style={{ fontFamily: font.sans, opacity: exit }}>
      <Background glow={[color.accent, color.ai]} />
      <AbsoluteFill
        style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 40 }}
      >
        <div style={{ transform: `translateY(${(1 - build) * 30}px)` }}>
          <Mark size={150} progress={build} />
        </div>
        <div
          style={{
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: `${interpolate(wordmark, [0, 1], [0.3, -0.02])}em`,
            opacity: wordmark,
          }}
        >
          <GradientText>cascivo</GradientText>
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 500,
            color: color.textMuted,
            opacity: ramp(frame, 44, 20),
          }}
        >
          The CSS-native, signal-driven, AI-first React design system
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
          {TAGS.map((tag, i) => {
            const t = ramp(frame, 64 + i * 7, 16)
            return (
              <span
                key={tag}
                style={{
                  padding: '12px 26px',
                  borderRadius: 999,
                  border: `1px solid ${color.borderStrong}`,
                  background: 'rgba(255, 255, 255, 0.04)',
                  fontSize: 26,
                  fontWeight: 600,
                  color: color.text,
                  opacity: t,
                  transform: `translateY(${(1 - t) * 16}px)`,
                }}
              >
                {tag}
              </span>
            )
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
