import type { ContextComponent } from './context.js'

export interface SelectResult {
  name: string
  score: number
  why: string
}

// Minimum length for a need word to be scored (filters out articles, prepositions, etc.)
const MIN_WORD_LEN = 3

function words(text: string): string[] {
  return (text.toLowerCase().match(/\b\w+\b/g) ?? []).filter((w) => w.length >= MIN_WORD_LEN)
}

function countMatches(needWords: string[], text: string): string[] {
  const lower = text.toLowerCase()
  return needWords.filter((w) => lower.includes(w))
}

export function selectComponent(need: string, components: ContextComponent[]): SelectResult[] {
  const needWords = words(need)
  if (needWords.length === 0) return []

  const scored = components.map((c) => {
    const whenToUseText = c.intent.whenToUse.join(' ')
    const whenNotToUseText = c.intent.whenNotToUse.join(' ')

    const whenToUseMatches = countMatches(needWords, whenToUseText)
    const descMatches = countMatches(needWords, c.description)
    const penaltyMatches = countMatches(needWords, whenNotToUseText)

    const score = whenToUseMatches.length * 2 + descMatches.length - penaltyMatches.length * 3

    // Build why from the best-matching whenToUse sentence
    let why = ''
    if (whenToUseMatches.length > 0) {
      const bestSentence = c.intent.whenToUse
        .map((s) => ({ s, count: countMatches(needWords, s).length }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count)[0]?.s
      why = bestSentence
        ? `Matched: ${whenToUseMatches.map((w) => `'${w}'`).join(', ')} in whenToUse — "${bestSentence}"`
        : `Matched: ${whenToUseMatches.map((w) => `'${w}'`).join(', ')} in description`
    } else if (descMatches.length > 0) {
      why = `Matched: ${descMatches.map((w) => `'${w}'`).join(', ')} in description`
    }

    return { name: c.name, score, why, related: c.intent.related ?? [] }
  })

  // First pass: top 3 by score for related bonus
  const top3Names = new Set(
    [...scored]
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 3)
      .map((r) => r.name),
  )

  // Apply related bonus: +1 if a top-3 component points at this component
  const relatedBonus = new Map<string, number>()
  for (const r of scored) {
    if (!top3Names.has(r.name)) continue
    for (const rel of r.related) {
      relatedBonus.set(rel.name, (relatedBonus.get(rel.name) ?? 0) + 1)
    }
  }

  const final = scored.map((r) => ({
    name: r.name,
    score: r.score + (relatedBonus.get(r.name) ?? 0),
    why: r.why,
  }))

  return final
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 5)
}
