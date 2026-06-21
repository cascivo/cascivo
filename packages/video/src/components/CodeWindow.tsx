import { color, font } from '../theme'

export interface CodeLine {
  text: string
  tint?: string
}

interface CodeWindowProps {
  title?: string
  lines: CodeLine[]
  /** Number of lines currently revealed (for typed-in effect). */
  revealed?: number
  style?: React.CSSProperties
  accent?: string
}

/** A macOS-style window frame wrapping monospaced, lightly highlighted code. */
export const CodeWindow: React.FC<CodeWindowProps> = ({
  title = 'app.tsx',
  lines,
  revealed = lines.length,
  style,
  accent = color.accent,
}) => (
  <div
    style={{
      width: '100%',
      borderRadius: 18,
      background: color.surface,
      border: `1px solid ${color.border}`,
      boxShadow: `0 40px 120px rgba(0, 0, 0, 0.5), 0 0 0 1px ${accent}22`,
      overflow: 'hidden',
      ...style,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '18px 24px',
        borderBottom: `1px solid ${color.border}`,
        background: color.surfaceRaised,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: 999, background: '#ff5f57' }} />
      <span style={{ width: 14, height: 14, borderRadius: 999, background: '#febc2e' }} />
      <span style={{ width: 14, height: 14, borderRadius: 999, background: '#28c840' }} />
      <span
        style={{
          marginInlineStart: 16,
          color: color.textMuted,
          fontFamily: font.mono,
          fontSize: 22,
        }}
      >
        {title}
      </span>
    </div>
    <div
      style={{
        padding: '28px 34px',
        fontFamily: font.mono,
        fontSize: 30,
        lineHeight: 1.7,
        whiteSpace: 'pre',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={`${i}-${line.text}`}
          style={{ color: line.tint ?? color.text, opacity: i < revealed ? 1 : 0 }}
        >
          {line.text === '' ? ' ' : line.text}
        </div>
      ))}
    </div>
  </div>
)
