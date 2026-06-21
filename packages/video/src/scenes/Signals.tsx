import { useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const GRID = Array.from({ length: 16 }, (_, i) => i)
const TARGET = 9

const Panel: React.FC<{
  title: string
  tint: string
  pulse: number
  /** Which cells light up on a tick: 'all' (VDOM) or just the changed one. */
  mode: 'all' | 'one'
  count: number
  appear: number
}> = ({ title, tint, pulse, mode, count, appear }) => (
  <div
    style={{
      flex: 1,
      padding: 44,
      borderRadius: 24,
      background: color.surface,
      border: `1px solid ${color.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 30,
      opacity: appear,
      transform: `translateY(${(1 - appear) * 30}px)`,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 34, fontWeight: 700, fontFamily: font.mono, color: tint }}>
        {title}
      </span>
      <span style={{ fontSize: 26, color: color.textMuted }}>re-renders</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
      {GRID.map((cell) => {
        const lit = mode === 'all' || cell === TARGET ? pulse : 0
        return (
          <div
            key={cell}
            style={{
              aspectRatio: '1',
              borderRadius: 14,
              background: `color-mix(in oklch, ${tint} ${lit * 100}%, ${color.surfaceRaised})`,
              border: `1px solid ${color.border}`,
              boxShadow: lit > 0.2 ? `0 0 ${lit * 26}px ${tint}aa` : 'none',
            }}
          />
        )
      })}
    </div>
    <span style={{ fontSize: 80, fontWeight: 800, fontFamily: font.mono, color: tint }}>
      {count.toLocaleString()}
    </span>
  </div>
)

export const Signals: React.FC = () => {
  const frame = useCurrentFrame()
  const tick = Math.max(0, Math.floor((frame - 40) / 16))
  const phase = ((frame - 40) % 16) / 16
  const pulse = frame < 40 ? 0 : Math.max(0, 1 - phase * 1.4)

  return (
    <Stage glow={[color.danger, color.success]}>
      <div style={riseIn(frame, 0)}>
        <Eyebrow tint={color.success}>Signal-driven interactivity</Eyebrow>
      </div>
      <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, ...riseIn(frame, 8) }}>
        Update one node. <GradientText variant="brand">Not the whole tree.</GradientText>
      </div>
      <div style={{ display: 'flex', gap: 50, width: '100%', marginTop: 20 }}>
        <Panel
          title="useState"
          tint={color.danger}
          mode="all"
          pulse={pulse}
          count={tick * 16}
          appear={ramp(frame, 22, 16)}
        />
        <Panel
          title="cascivo signals"
          tint={color.success}
          mode="one"
          pulse={pulse}
          count={Math.min(1, tick)}
          appear={ramp(frame, 30, 16)}
        />
      </div>
    </Stage>
  )
}
