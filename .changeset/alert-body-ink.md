---
'@cascivo/react': patch
---

`Alert` body text keeps the theme's text colour on every variant. The tinted variants used to
set the whole alert's colour to their on-fill ink, which is meant for text on the solid status
colour, not on the pale tint, and read poorly in several themes. The icon and title keep their
status colour.
