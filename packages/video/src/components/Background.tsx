import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { color } from '../theme'

interface BackgroundProps {
  /** Tint of the two drifting glow blooms. */
  glow?: [string, string]
  /** Show the faint engineering grid. */
  grid?: boolean
}

/** Shared cinematic stage: deep base, drifting color blooms, optional grid. */
export const Background: React.FC<BackgroundProps> = ({
  glow = [color.accent, color.ai],
  grid = true,
}) => {
  const frame = useCurrentFrame()
  const drift = Math.sin(frame / 60) * 40
  const drift2 = Math.cos(frame / 70) * 50

  return (
    <AbsoluteFill
      style={{ background: `radial-gradient(circle at 50% 30%, ${color.bgAlt}, ${color.bg})` }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(620px circle at ${28 + drift / 8}% 32%, ${glow[0]}33, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(680px circle at ${74 + drift2 / 8}% 70%, ${glow[1]}2e, transparent 60%)`,
        }}
      />
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${color.border} 1px, transparent 1px), linear-gradient(90deg, ${color.border} 1px, transparent 1px)`,
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(circle at 50% 45%, black, transparent 80%)',
            opacity: 0.5,
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          boxShadow: 'inset 0 0 320px rgba(0, 0, 0, 0.75)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  )
}
