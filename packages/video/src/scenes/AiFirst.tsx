import { useCurrentFrame } from 'remotion'
import { ramp, riseIn } from '../anim'
import { Eyebrow } from '../components/Eyebrow'
import { GradientText } from '../components/GradientText'
import { Stage } from '../components/Stage'
import { color, font } from '../theme'

const COMMAND = '$ npx cascivo add button'
const OUTPUT = [
  { text: '✔ resolved registry.json', tint: color.success },
  { text: '✔ wrote components/cascivo/button.tsx', tint: color.textMuted },
  { text: '✔ wrote components/cascivo/button.css', tint: color.textMuted },
  { text: '✔ button ready — you own the source', tint: color.aiBright },
]

const SURFACES = [
  'MCP server',
  'component.meta.ts',
  'llms.txt',
  'closed-set token catalog',
  'cascivo audit --ai',
]

export const AiFirst: React.FC = () => {
  const frame = useCurrentFrame()
  const typed = Math.floor(ramp(frame, 26, 30) * COMMAND.length)
  const caret = Math.floor(frame / 8) % 2 === 0

  return (
    <Stage glow={[color.ai, color.accent]} align="start">
      <div style={riseIn(frame, 0)}>
        <Eyebrow tint={color.aiBright}>AI-first context layer</Eyebrow>
      </div>
      <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05, ...riseIn(frame, 8) }}>
        Built for agents, <GradientText variant="ai">not just humans.</GradientText>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 56,
          width: '100%',
          alignItems: 'center',
          marginTop: 18,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            background: '#0a0612',
            border: `1px solid ${color.ai}44`,
            boxShadow: `0 40px 120px rgba(0, 0, 0, 0.5), 0 0 60px ${color.ai}22`,
            padding: '34px 38px',
            fontFamily: font.mono,
            fontSize: 32,
            lineHeight: 1.7,
            ...riseIn(frame, 18),
          }}
        >
          <div style={{ color: color.text }}>
            {COMMAND.slice(0, typed)}
            {typed < COMMAND.length && caret ? (
              <span style={{ color: color.aiBright }}>▋</span>
            ) : null}
          </div>
          {OUTPUT.map((line, i) => {
            const t = ramp(frame, 60 + i * 9, 10)
            return (
              <div key={line.text} style={{ color: line.tint, opacity: t }}>
                {line.text}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {SURFACES.map((surface, i) => {
            const t = ramp(frame, 48 + i * 8, 14)
            return (
              <div
                key={surface}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 24px',
                  borderRadius: 14,
                  background: `${color.ai}14`,
                  border: `1px solid ${color.ai}44`,
                  fontSize: 32,
                  fontWeight: 600,
                  fontFamily: font.mono,
                  color: color.text,
                  opacity: t,
                  transform: `translateX(${(1 - t) * 26}px)`,
                }}
              >
                <span style={{ color: color.aiBright }}>◆</span>
                {surface}
              </div>
            )
          })}
        </div>
      </div>
    </Stage>
  )
}
