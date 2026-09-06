/**
 * RFC 4180 CSV for the table's export button: CRLF records, a field quoted whenever it
 * holds a comma, a quote, a CR or an LF, quotes doubled. Values are the raw cell values
 * (not the rendered cells), stringified the way the default cell is: `null`/`undefined`
 * become an empty field.
 */

interface CsvColumn {
  key: string
  header: string
}

export function csvField(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** The CSV document: one header record from `columns`, then one record per row. */
export function toCsv<Row>(
  rows: readonly Row[],
  columns: readonly CsvColumn[],
  valueOf: (row: Row, key: string) => unknown,
): string {
  const lines = [columns.map((col) => csvField(col.header)).join(',')]
  for (const row of rows) {
    lines.push(columns.map((col) => csvField(valueOf(row, col.key))).join(','))
  }
  return lines.join('\r\n') + '\r\n'
}

/**
 * Hand a CSV to the browser as a download. Prefixed with a byte-order mark so spreadsheet
 * apps read non-ASCII text as UTF-8 rather than guessing a legacy code page.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
