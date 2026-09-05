import { describe, expect, it } from 'vitest'
import { csvField, toCsv } from './to-csv'

describe('csvField', () => {
  it('quotes only what RFC 4180 requires, doubling embedded quotes', () => {
    expect(csvField('plain')).toBe('plain')
    expect(csvField('a,b')).toBe('"a,b"')
    expect(csvField('say "hi"')).toBe('"say ""hi"""')
    expect(csvField('two\nlines')).toBe('"two\nlines"')
    expect(csvField(12.5)).toBe('12.5')
  })
  it('renders null and undefined as an empty field', () => {
    expect(csvField(null)).toBe('')
    expect(csvField(undefined)).toBe('')
  })
})

describe('toCsv', () => {
  it('writes a header record then one CRLF-terminated record per row', () => {
    const rows = [
      { name: 'Ada, Countess', qty: 3 },
      { name: 'Bob', qty: null },
    ]
    const csv = toCsv(
      rows,
      [
        { key: 'name', header: 'Name' },
        { key: 'qty', header: 'Qty "units"' },
      ],
      (row, key) => row[key as keyof typeof row],
    )
    expect(csv).toBe('Name,"Qty ""units"""\r\n"Ada, Countess",3\r\nBob,\r\n')
  })
  it('is just the header for no rows', () => {
    expect(toCsv([], [{ key: 'a', header: 'A' }], () => '')).toBe('A\r\n')
  })
})
