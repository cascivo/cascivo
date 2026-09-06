---
'@cascivo/react': minor
'@cascivo/i18n': minor
---

`FileUploader`'s announcements, identity and touch targets. Every prop keeps its shape; the
only API addition is the new `cascade.fileUploader.status` catalog message.

**The first upload was always silent.** The `aria-live` region was the file list itself, which
is mounted in the same commit as its first file — a live region only announces content added
_after_ it exists, so the very announcement that matters most never fired. A single polite
region is now mounted unconditionally and reports the count plus the list-wide state
(`1 file: Uploading`, `2 files: Upload complete`), pluralised through the catalog rather than
by string concatenation.

**Per-file status never reached a screen reader.** "Upload complete" and "Upload failed" were
`aria-label` on a roleless `<span>`, where `aria-label` is not honoured, so the tick and the
cross announced nothing at all. Both carry `role="img"` now, and a failed file's message is a
`role="alert"`.

**Two uploaders on one page collided.** Ids were a slug of the resolved label — which defaults
to the same string for every instance — so `aria-describedby` on the second uploader resolved
to the first one's text, and a non-ASCII label produced ids containing arbitrary characters.
Ids come from `useId`.

**The zone announced the wrong name.** The visible label was wired as a _description_, so every
uploader was named by its generic "Drag and drop files here…" text instead of by the field. The
label names the zone (`aria-labelledby`, or `ariaLabel` when given) and the hint describes it.

Also fixed:

- **`aria-hidden` on the focusable file input.** The input is programmatically `.click()`ed and
  is a focusable node, which makes `aria-hidden` on it the canonical `aria-hidden-focus`
  violation. Removed; it stays out of the tab order via `tabIndex={-1}`.
- **`disabled` did not reach the remove buttons**, so a disabled uploader could still have its
  files removed.
- **File sizes were hardcoded English.** `"2.5 MB"` reads wrong in every comma-decimal locale.
  Sizes now go through `Intl.NumberFormat`'s `unit` style in the current locale.
- **The drag-over state flickered off mid-drag**, because `dragleave` fires on the zone every
  time the pointer crosses onto a descendant. Guarded with `relatedTarget` containment, plus
  `pointer-events: none` on the zone text for the browsers that report a null `relatedTarget`.
- **`labels.remove` replaced only the first `{name}`**; it replaces every occurrence now.
- **Remove buttons were roughly 20px**, below WCAG 2.2 SC 2.5.8's floor, with no coarse-pointer
  block in the stylesheet at all. They meet the 44px target now.
- **Drag-over, disabled and error were colour-only**, which forced-colors flattens away
  entirely; each has a forced-colors treatment.
- The drop zone sets `dropEffect = 'copy'` so the cursor matches what will happen.
