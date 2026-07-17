/**
 * Pure-CSS glyph geometry — source of truth for scripts/icons/generate-glyphs.mjs.
 *
 * Each glyph is one or more open polyline "strokes" in a 24×24 box (chromicons
 * convention), stroke-width 2, round caps. The generator expands every stroke to
 * its filled outline and emits a `clip-path: shape()` value into
 * packages/icons/src/glyphs.css. Authoring the geometry here (not the CSS by
 * hand) keeps the outline math and morph-structure validation in one place and
 * the shapes human-editable.
 *
 * Phase 1 scope: stroke-based glyphs plus one structure-matched morph. Filled-disc
 * glyphs (dots) and rotation-style morphs (menu↔x) are deliberately out of scope —
 * Phase 0 showed the former need a separate disc primitive and the latter cannot
 * be a single-element clip-path interpolation.
 */

/** A point in the 24×24 authoring box: [x, y], each 0–24. */
export type Point = readonly [x: number, y: number]

/** An open polyline — the centerline of one stroke. */
export type Stroke = readonly Point[]

export interface GlyphSpec {
  readonly name: string
  readonly strokes: readonly Stroke[]
}

/**
 * Static glyphs. Order is stable (generator emits in this order). Scope is the
 * straight-stroke set the outline generator draws exactly; curved glyphs (search
 * ring, circle, info) and filled discs (dots) need a separate primitive and are
 * deferred.
 */
export const GLYPHS = [
  {
    name: 'chevron-down',
    strokes: [
      [
        [6, 9],
        [12, 15],
        [18, 9],
      ],
    ],
  },
  {
    name: 'chevron-up',
    strokes: [
      [
        [6, 15],
        [12, 9],
        [18, 15],
      ],
    ],
  },
  {
    name: 'chevron-left',
    strokes: [
      [
        [15, 6],
        [9, 12],
        [15, 18],
      ],
    ],
  },
  {
    name: 'chevron-right',
    strokes: [
      [
        [9, 6],
        [15, 12],
        [9, 18],
      ],
    ],
  },
  {
    name: 'x',
    strokes: [
      [
        [6, 6],
        [18, 18],
      ],
      [
        [18, 6],
        [6, 18],
      ],
    ],
  },
  {
    name: 'check',
    strokes: [
      [
        [5, 12.5],
        [10, 17.5],
        [19.5, 6.5],
      ],
    ],
  },
  {
    name: 'plus',
    strokes: [
      [
        [12, 6],
        [12, 18],
      ],
      [
        [6, 12],
        [18, 12],
      ],
    ],
  },
  {
    name: 'minus',
    strokes: [
      [
        [6, 12],
        [18, 12],
      ],
    ],
  },
  {
    name: 'menu',
    strokes: [
      [
        [4, 7],
        [20, 7],
      ],
      [
        [4, 12],
        [20, 12],
      ],
      [
        [4, 17],
        [20, 17],
      ],
    ],
  },
  {
    name: 'arrow-right',
    strokes: [
      [
        [4, 12],
        [20, 12],
      ],
      [
        [13, 5],
        [20, 12],
        [13, 19],
      ],
    ],
  },
  {
    name: 'arrow-left',
    strokes: [
      [
        [20, 12],
        [4, 12],
      ],
      [
        [11, 5],
        [4, 12],
        [11, 19],
      ],
    ],
  },
  {
    name: 'arrow-up',
    strokes: [
      [
        [12, 20],
        [12, 4],
      ],
      [
        [5, 11],
        [12, 4],
        [19, 11],
      ],
    ],
  },
  {
    name: 'arrow-down',
    strokes: [
      [
        [12, 4],
        [12, 20],
      ],
      [
        [5, 13],
        [12, 20],
        [19, 13],
      ],
    ],
  },
] as const satisfies readonly GlyphSpec[]

export type GlyphName = (typeof GLYPHS)[number]['name']

export interface MorphSpec {
  readonly name: string
  readonly from: GlyphName
  readonly to: GlyphName
}

/**
 * Morphs: a `[data-glyph]` value that animates via `transition: clip-path` when
 * the element gains `[data-state="open"]`. Both shapes MUST share command
 * structure (same subpath and point counts) — the generator hard-fails otherwise.
 *
 * Structure-match is necessary but NOT sufficient: a ~90° rotation pair
 * (chevron-right↔down) shares structure yet interpolates through coincident
 * outline points (a degenerate zero-length arc → invalid shape). Only reflection-
 * style pairs whose points travel without crossing qualify (chevron down↔up), and
 * every morph must be screenshot-verified across the transition before shipping.
 * `from`/`to` reference glyph names above.
 */
export const MORPHS = [
  { name: 'chevron-toggle', from: 'chevron-down', to: 'chevron-up' },
] as const satisfies readonly MorphSpec[]

export type MorphName = (typeof MORPHS)[number]['name']
