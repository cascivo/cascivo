---
'@cascivo/react': patch
---

`TabsList`, `TabsTrigger`, `TabsContent`, `AccordionItem`, `AccordionTrigger` and
`AccordionContent` now throw a guidance error when rendered outside their root instead of
silently rendering nothing. Astro renders every `.astro` child separately, so React context cannot
reach a compound part there; the message says to compose the parts in one `.tsx` island and hydrate
that island, matching `PopoverTrigger` and `MenuTrigger`.
