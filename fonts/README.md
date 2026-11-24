# Cascivo fonts

One parametric engine (`cascivo-sans/src`), four families. Siblings load through
`cascivo-sans/src/family.py`; see [PLAN-families.md](./PLAN-families.md).

| Family            | Dir                  | Status           | Score (refs)                                    |
| ----------------- | -------------------- | ---------------- | ----------------------------------------------- |
| Cascivo Sans      | `cascivo-sans/`      | shipped, 0.6.1   | see `cascivo-sans/JUDGING.md`                   |
| Cascivo Mono      | `cascivo-mono/`      | v1, upright only | 7.78 (JetBrains Mono, Geist Mono)               |
| Cascivo Serif     | `cascivo-serif/`     | v1, upright only | 5.61 (Source Serif 4; Sans scores 4.41)         |
| Cascivo Condensed | `cascivo-condensed/` | v1, upright only | 8.06 (Inter Tight, Roboto Condensed; Sans 7.57) |

Build a sibling: `cd cascivo-sans && CASCIVO_FAMILY=mono python3 -I src/build.py`; gates:
`python3 -I -m unittest discover -s cascivo-mono/src`. Each sibling's `NOTES.md` lists its gaps.
Scores are v1 numbers from `score.run(ref_paths=...)`; the optical-size item is meaningless where
the references have no opsz axis. Not wired into the site yet.
