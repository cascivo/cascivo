---
'@cascivo/email': patch
---

Fixed theme palette resolution so that mixing a colour toward white, black or grey keeps the
colour's hue. CSS Color 4 treats an achromatic colour's hue as powerless. Before, the resolver
took the grey's leftover hue and pulled the tint off-hue. A tint of a violet toward white came
out peach.
