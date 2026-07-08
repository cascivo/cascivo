import type { BlogPost } from '../types'

export const post: BlogPost = {
  slug: 'modern-css-component-library',
  title: 'Do you still need a component library with modern CSS?',
  description:
    '@layer, @container, and :has() close real gaps that used to require a utility framework or JavaScript. Here’s what they replace, in code, and why "modern CSS is enough" and "you still want a component library" aren’t actually in tension.',
  datePublished: '2026-07-07',
  tags: ['css', 'architecture'],
  blocks: [
    {
      type: 'p',
      text: 'Three CSS features shipped in the last few years that each quietly close a gap teams used to reach for a framework or JavaScript to solve. None of them are new syntax for old ideas — each one lets you delete a category of workaround, not just write it more tersely.',
    },
    { type: 'h2', text: '@layer replaces the specificity arms race' },
    {
      type: 'p',
      text: 'Utility frameworks and CSS-in-JS both fight the same underlying problem: whoever’s selector is more specific, or whoever’s style tag loads last, wins — so overriding anything reliably means reaching for !important or inline styles. @layer sidesteps the fight entirely by assigning explicit cascade priority up front:',
    },
    {
      type: 'code',
      lang: 'tsx',
      code: `/* Before — specificity arms race */
.btn { color: blue; }
.text-red-500 { color: red !important; } /* must win — no choice */

/* After — @layer: priority is explicit, not fought over */
@layer cascivo.base, cascivo.component, cascivo.override;

@layer cascivo.component {
  .btn { color: var(--cascivo-color-accent); }
}
@layer cascivo.override {
  .btn { color: var(--brand-red); } /* your theme wins cleanly */
}`,
    },
    { type: 'h2', text: '@container replaces "just use a media query" (which was always wrong)' },
    {
      type: 'p',
      text: 'A @media query responds to the viewport, not to the space a component actually occupies. A card in a 300px sidebar and the same card in a full-width grid cell look identical to a media query — both are on a 1440px-wide screen. @container asks the right question:',
    },
    {
      type: 'code',
      lang: 'tsx',
      code: `/* Before — responds to viewport width, not component width */
@media (max-width: 640px) {
  .card { flex-direction: column; }
}
/* Breaks inside a narrow sidebar at a wide viewport */

/* After — responds to the card's actual container */
.card-wrapper { container-type: inline-size; }

@container (inline-size < 20rem) {
  .card { flex-direction: column; }
}
/* Works in a 300px sidebar AND a 900px grid cell */`,
    },
    { type: 'h2', text: ':has() replaces JS class-toggling for conditional styling' },
    {
      type: 'p',
      text: '"Form has an error," "dialog is open," "checkbox is checked" — these used to mean an event listener adding and removing a class, and remembering to clean it up on valid, on reset, on unmount. :has() expresses the same condition declaratively, with zero runtime cost and nothing to forget to unbind:',
    },
    {
      type: 'code',
      lang: 'tsx',
      code: `// Before — JavaScript required for every visual state
input.addEventListener('invalid', () => {
  formGroup.classList.add('has-error')
})
// ...and cleaned up on valid, on reset, on unmount

/* After — pure CSS, no event handlers */
.form-group:has(input:invalid) .form-label {
  color: var(--cascivo-color-destructive);
}
.form-group:has(input:focus-visible) {
  outline: 2px solid var(--cascivo-color-accent);
}`,
    },
    { type: 'h2', text: 'So why still use a component library?' },
    {
      type: 'p',
      text: 'None of this replaces the actual hard parts of a component: keyboard navigation that matches the WAI-ARIA APG, focus management inside a modal, a listbox that announces correctly to a screen reader, the twenty edge cases in a date picker. Modern CSS closes the styling gap that used to justify pulling in a heavyweight runtime framework just to manage class names — it doesn’t touch the accessibility and interaction-logic gap, which was never a styling problem in the first place.',
    },
    {
      type: 'callout',
      text: 'The honest framing: modern CSS means a component library doesn’t need to own your styling architecture anymore. It still needs to own correctness — roles, keyboard handling, focus — because that was always the hard part.',
    },
    {
      type: 'p',
      text: 'That’s the actual argument for building on @layer/@container/:has() instead of a utility framework: not "CSS replaced components," but "CSS stopped being the reason you needed a JavaScript-heavy one."',
    },
    {
      type: 'links',
      items: [
        { text: 'The full modern-CSS argument, with every example live', href: '/modern-css' },
        {
          text: 'What actually changes if you migrate off Tailwind utilities',
          href: '/blog/owned-code-shadcn',
        },
        { text: 'Browse the component set', href: '/docs' },
      ],
    },
  ],
}
