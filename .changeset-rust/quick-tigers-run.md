---
'cascivo-html': minor
---

Tabs emit the ARIA tablist (`role=tablist/tab/tabpanel`) inside `<cv-tabs>`, the same markup React renders; the `cv-tabs` script is added through `client_js`. Without it every panel stacks and the tablist is hidden. The radio-input markup and `tabs.css` are gone.
