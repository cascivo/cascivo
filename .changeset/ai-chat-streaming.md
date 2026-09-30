---
'@cascivo/ai': patch
---

`StreamingText` now keeps revealing text as its `text` prop grows. Its effect read the prop
from a closure, so a reply streamed into `AiChat` froze at the first chunk and appeared only
when complete. `AiChat` now also follows new content while the reader is at the bottom of the
log, and stops following once they scroll up; the log previously never scrolled.
