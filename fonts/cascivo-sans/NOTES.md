# Cascivo Sans: notes

The engine owner. `src/glyphs.py` and `src/params.py` are shared with Mono, Serif and Condensed (`fonts/PLAN-families.md`):
a change here reaches them, so rebuild all four and run their `test_family.py`.

Round history, scores and every tried-and-reverted change: `JUDGING.md`. Changes: `CHANGELOG.md`.

Known gaps (after round 10, engine: Thin A hand-kerned, bar sidebearings, shorter Black Q tail; JUDGING.md):

- Black `e`: the lower terminal overhangs the bowl a little; its aperture and Display-face gates hold the run.
- Heavy rounds (`O Q b d p q`) have lighter counters than Inter's (`score.py` counter z 3-5); heavier bowls broke gates (round 6).
- The `Q` tail may not enter the counter (`quality.py` hull gate), so it cannot take Inter's cross-through form.
- The 600 -> 700 width step on diagonal capitals and `m w` (`wstep`), from the Bold spacing master.
- `I` / `1` read alike at 12 px Black (serifed `I` slabs thin at 800-900).
