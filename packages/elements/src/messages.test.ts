import { builtin } from '@cascivo/i18n'
import { describe, expect, it } from 'vitest'
import * as local from './messages.ts'

describe('element messages', () => {
  // Same key + same default as the builtin catalog, so one translation covers both stacks.
  for (const [group, messages] of Object.entries(local)) {
    if (group === 'elements') continue
    for (const [name, message] of Object.entries(messages)) {
      it(`${group}.${name} matches builtin`, () => {
        const shared = (builtin as Record<string, Record<string, unknown>>)[group]?.[name]
        expect(shared).toEqual(message)
      })
    }
  }
})
