import type { PropMeta } from '../../data'

export function PropsTable({ props }: { props: PropMeta[] }) {
  if (props.length === 0) {
    return <p class="muted">This component takes no documented props.</p>
  }

  return (
    <div class="table-wrap">
      <table class="props-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Default</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name}>
              <td>
                <code>{prop.name}</code>
              </td>
              <td>
                <code class="type">{prop.type}</code>
              </td>
              <td>{prop.default ? <code>{prop.default}</code> : <span class="muted">—</span>}</td>
              <td>{prop.required ? 'Yes' : <span class="muted">No</span>}</td>
              <td>{prop.description ?? <span class="muted">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
