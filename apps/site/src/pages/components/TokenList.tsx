export function TokenList({ tokens }: { tokens: string[] }) {
  if (tokens.length === 0) {
    return <p class="muted">This component reads no component-specific tokens.</p>
  }

  return (
    <ul class="token-list">
      {tokens.map((token) => (
        <li key={token}>
          <code>{token}</code>
        </li>
      ))}
    </ul>
  )
}
