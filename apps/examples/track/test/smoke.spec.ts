import { describe, it, expect } from 'vitest'
import { SEED_ISSUES, USERS, LABELS } from '../src/data/seed'

describe('seed data', () => {
  it('generates 20 issues', () => {
    expect(SEED_ISSUES).toHaveLength(20)
  })

  it('generates 5 users', () => {
    expect(USERS).toHaveLength(5)
  })

  it('generates 5 labels', () => {
    expect(LABELS).toHaveLength(5)
  })

  it('all issues have valid status', () => {
    const VALID_STATUSES = new Set(['backlog', 'todo', 'in-progress', 'in-review', 'done'])
    for (const issue of SEED_ISSUES) {
      expect(VALID_STATUSES.has(issue.status)).toBe(true)
    }
  })

  it('all issues have valid priority', () => {
    const VALID_PRIORITIES = new Set(['urgent', 'high', 'medium', 'low'])
    for (const issue of SEED_ISSUES) {
      expect(VALID_PRIORITIES.has(issue.priority)).toBe(true)
    }
  })

  it('all label references are valid', () => {
    const labelIds = new Set(LABELS.map((l) => l.id))
    for (const issue of SEED_ISSUES) {
      for (const lid of issue.labelIds) {
        expect(labelIds.has(lid)).toBe(true)
      }
    }
  })

  it('all assignee references are valid or null', () => {
    const userIds = new Set(USERS.map((u) => u.id))
    for (const issue of SEED_ISSUES) {
      if (issue.assigneeId !== null) {
        expect(userIds.has(issue.assigneeId)).toBe(true)
      }
    }
  })
})
