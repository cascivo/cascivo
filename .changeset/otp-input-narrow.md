---
'@cascivo/react': patch
---

`OtpInput`'s cells shrink to share a narrow container instead of overflowing it. Each cell
was a fixed 2.75rem, so six cells and their gaps (304px) overflowed a padded card on a 320px
screen. They keep that size wherever it fits.
