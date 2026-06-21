import { interpolate, useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const CATEGORIES = [
  { name: 'display', count: 45 },
  { name: 'inputs', count: 38 },
  { name: 'layout', count: 27 },
  { name: 'navigation', count: 18 },
  { name: 'chart', count: 16 },
  { name: 'overlay', count: 14 },
  { name: 'feedback', count: 7 },
]

const NAMES = [
  'Button',
  'Card',
  'Dialog',
  'Combobox',
  'DataTable',
  'Toast',
  'Tabs',
  'Slider',
  'Calendar',
  'Tooltip',
  'Drawer',
  'Avatar',
  'Badge',
  'Stepper',
  'Tree',
  'Chart',
  'Command',
  'Switch',
  'Popover',
  'Accordion',
  'Breadcrumb',
  'Pagination',
  'Skeleton',
  'Sheet',
]

const Marquee: React.FC<{ row: string[]; offset: number; speed: number }> = ({
  row,
  offset,
  speed,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 22,
      transform: `translateX(${offset - speed}px)`,
      width: 'max-content',
    }}
  >
    {[...row, ...row].map((name, i) => (
      <span
        key={`${name}-${i}`}
        style={{
          padding: '16px 30px',
          borderRadius: 14,
          background: color.surface,
          border: `1px solid ${color.border}`,
          fontSize: 34,
          fontWeight: 600,
          color: color.text,
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
    ))}
  </div>
)

export const Components: React.FC = () => {
  const frame = useCurrentFrame()
  const total = Math.round(interpolate(ramp(frame, 14, 40), [0, 1], [0, 165]))
  const half = Math.ceil(NAMES.length / 2)

  return (
    <Stage glow={[color.accent, color.cyan]}>
      <div style={riseIn(frame, 0)}>
        <Eyebrow>One token system</Eyebrow>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 28,
          ...riseIn(frame, 8),
        }}
      >
        <span style={{ fontSize: 200, fontWeight: 800, lineHeight: 1 }}>
          <GradientText>{total}</GradientText>
        </span>
        <span style={{ fontSize: 70, fontWeight: 700, color: color.text }}>components</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        {CATEGORIES.map((cat, i) => {
          const t = ramp(frame, 40 + i * 6, 14)
          return (
            <span
              key={cat.name}
              style={{
                display: 'inline-flex',
                gap: 12,
                alignItems: 'center',
                padding: '12px 22px',
                borderRadius: 999,
                border: `1px solid ${color.border}`,
                fontFamily: font.sans,
                fontSize: 30,
                color: color.textMuted,
                opacity: t,
                transform: `translateY(${(1 - t) * 14}px)`,
              }}
            >
              {cat.name}
              <strong style={{ color: color.accentBright }}>{cat.count}</strong>
            </span>
          )
        })}
      </div>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          marginTop: 20,
          opacity: ramp(frame, 56, 18),
          maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
          overflow: 'hidden',
        }}
      >
        <Marquee row={NAMES.slice(0, half)} offset={0} speed={frame * 2.2} />
        <Marquee row={NAMES.slice(half)} offset={-260} speed={frame * 1.6} />
      </div>
    </Stage>
  )
}
